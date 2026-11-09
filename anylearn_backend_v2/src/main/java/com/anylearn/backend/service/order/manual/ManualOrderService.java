package com.anylearn.backend.service.order.manual;

import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.AuthService;
import com.anylearn.backend.service.CartService;
import com.anylearn.backend.service.PersonNames;
import com.anylearn.backend.service.UserService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import com.anylearn.backend.service.signup.SignupRules;
import com.anylearn.backend.service.zns.ZnsNotifier;
import com.anylearn.backend.service.zns.ZnsTemplates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Orders an admin enters by hand (money collected at the school, by phone, at an event...). Each order is one transaction:
 * find or create the buyer (`member`), find or create the child, place the order through {@link CartService#adminCheckout}
 * (the same order rows as a checkout), then either approve it at once through {@link PaymentApprovalService#approveOrder}
 * (paid: enrollments, ZNS "đăng ký thành công", email, anyPoint, Foundation share, first-order rewards, vouchers) or leave it
 * waiting for payment (reminders and auto-cancel like any other order). A new account gets the ZNS "Tài khoản đã được tạo".
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ManualOrderService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AuthService authService;
    private final UserService userService;
    private final CartService cartService;
    private final PaymentApprovalService paymentApprovalService;
    private final JdbcTemplate jdbc;

    @Autowired(required = false)
    private ZnsNotifier znsNotifier;

    /** What the form shows after the phone is typed: the account (if any) and its children. */
    public Map<String, Object> lookup(String rawPhone) {
        String phone = SignupRules.normalizePhone(rawPhone);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("phone", phone);
        out.put("valid", SignupRules.validPhone(phone));
        User user = phone == null ? null : userRepository.findByPhone(phone).orElse(null);
        out.put("exists", user != null);
        if (user == null) return out;
        out.put("isChild", isChild(user));
        Map<String, Object> account = new LinkedHashMap<>();
        account.put("id", user.getId());
        account.put("name", user.getName());
        account.put("email", user.getEmail());
        account.put("role", user.getRole());
        account.put("status", user.getStatus());
        out.put("user", account);
        List<Map<String, Object>> children = new ArrayList<>();
        for (User child : userRepository.findByUserIdAndIsChild(user.getId(), (byte) 1)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", child.getId());
            row.put("name", child.getName());
            row.put("dob", child.getDob() == null ? null : child.getDob().toString());
            row.put("dobYearOnly", Boolean.TRUE.equals(child.getDobYearOnly()));
            children.add(row);
        }
        out.put("children", children);
        return out;
    }

    @Transactional
    public Map<String, Object> create(ManualOrderRules.Input in, User admin) {
        String phone = SignupRules.normalizePhone(in.phone());
        User buyer = phone == null ? null : userRepository.findByPhone(phone).orElse(null);
        String problem = ManualOrderRules.problem(in, buyer != null);
        if (problem != null) throw new IllegalArgumentException(problem);
        if (buyer != null && isChild(buyer)) throw new IllegalArgumentException("Số điện thoại này là tài khoản con, hãy nhập số của phụ huynh.");
        if (buyer != null && buyer.getStatus() != null && buyer.getStatus() == 0) throw new IllegalArgumentException("Tài khoản của số này đang bị khóa.");

        AuthService.CreatedAccount created = null;
        if (buyer == null) {
            created = authService.createMemberByAdmin(in.name(), phone, in.email());
            buyer = created.user();
        }

        Long learnerId = in.forChild() ? childOf(buyer, in) : null;
        List<CartService.ManualLine> lines = in.items().stream()
                .map(line -> new CartService.ManualLine(line.itemId(), learnerId, line.scheduleId(), blankToNull(line.startDate())))
                .toList();
        Map<String, Object> placed = cartService.adminCheckout(buyer, lines, in.payment());
        long orderId = Long.parseLong(String.valueOf(placed.get("orderId")));

        Order order = orderRepository.findById(orderId).orElseThrow();
        if (in.amount() != null) {
            order.setAmount(in.amount());
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }
        jdbc.update("""
                INSERT INTO manual_orders (order_id, admin_id, buyer_id, account_created, note) VALUES (?, ?, ?, ?, ?)""",
                orderId, admin.getId(), buyer.getId(), created != null ? 1 : 0, blankToNull(in.note()));

        // The account message is queued first, so it reaches the phone before the order message.
        boolean accountZns = false;
        if (created != null && znsNotifier != null) {
            accountZns = znsNotifier.send(buyer.getId(), null, ZnsTemplates.ACCOUNT_CREATED, "account_created:" + buyer.getId(),
                    ZnsTemplates.accountCreated(buyer.getName(), buyer.getPhone()));
        }

        if (in.paid()) paymentApprovalService.approveOrder(orderId, in.payment());
        else paymentApprovalService.setPayPending(orderId);
        log.info("[manual-order] admin {} entered order {} for user {} (new account: {}, paid: {})",
                admin.getId(), orderId, buyer.getId(), created != null, in.paid());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("orderId", orderId);
        out.put("buyerId", buyer.getId());
        out.put("buyerName", buyer.getName());
        out.put("phone", buyer.getPhone());
        out.put("learnerId", learnerId);
        out.put("accountCreated", created != null);
        // Shown once to the admin, who may tell the customer; the ZNS never carries it (the customer can also use "Quên mật khẩu").
        if (created != null) out.put("password", created.password());
        out.put("accountZnsQueued", accountZns);
        out.put("status", orderRepository.findById(orderId).map(Order::getStatus).orElse(null));
        out.put("amount", orderRepository.findById(orderId).map(Order::getAmount).orElse(null));
        return out;
    }

    /** The child of the order: the picked one (must belong to the buyer), the one with the same name, or a new one. */
    private Long childOf(User buyer, ManualOrderRules.Input in) {
        List<User> children = userRepository.findByUserIdAndIsChild(buyer.getId(), (byte) 1);
        if (in.childId() != null) {
            return children.stream().filter(child -> child.getId().equals(in.childId())).findFirst()
                    .map(User::getId)
                    .orElseThrow(() -> new IllegalArgumentException("Bé đã chọn không thuộc tài khoản này."));
        }
        String name = in.childName().trim();
        User same = children.stream().filter(child -> PersonNames.sameName(child.getName(), name)).findFirst().orElse(null);
        if (same != null) {
            if (same.getDob() == null && blankToNull(in.childDob()) != null) {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("id", same.getId());
                body.put("dob", ManualOrderRules.parseDate(in.childDob()).toString());
                body.put("dobYearOnly", in.childDobYearOnly());
                userService.saveChild(body, buyer);
            }
            return same.getId();
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        if (blankToNull(in.childDob()) != null) {
            body.put("dob", ManualOrderRules.parseDate(in.childDob()).toString());
            body.put("dobYearOnly", in.childDobYearOnly());
        }
        return userService.saveChild(body, buyer).getId();
    }

    private static boolean isChild(User user) {
        return user.getIsChild() != null && user.getIsChild() == 1;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
