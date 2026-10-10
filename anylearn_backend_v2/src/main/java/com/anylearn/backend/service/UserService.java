package com.anylearn.backend.service;

import com.anylearn.backend.dto.response.UserInfoResponse;
import com.anylearn.backend.entity.*;
import com.anylearn.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserDocumentRepository userDocumentRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ItemRepository itemRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final ItemCodeRepository itemCodeRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> usersList(String role, int pageSize) {
        if (!List.of("teacher", "school").contains(role)) {
            throw new IllegalArgumentException("Yêu cầu không đúng");
        }
        var page = userRepository.findActiveByRole(role, PageRequest.of(0, pageSize));
        var list = page.getContent().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("role", u.getRole());
            m.put("image", u.getImage());
            m.put("banner", u.getBanner());
            m.put("introduce", u.getIntroduce());
            m.put("title", u.getTitle());
            m.put("num_friends", u.getNumFriends());
            m.put("rating", itemUserActionRepository.avgRatingByOwner(u.getId()));
            return m;
        }).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        return result;
    }

    public Map<String, Object> profile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));
        var pageable = PageRequest.of(0, 10);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("title", user.getTitle());
        result.put("name", user.getName());
        result.put("image", user.getImage());
        result.put("role", user.getRole());
        result.put("introduce", user.getIntroduce());
        result.put("banner", user.getBanner());
        result.put("full_content", user.getFullContent());
        result.put("docs", userDocumentRepository.findByUserId(userId));
        result.put("registered", orderDetailRepository.findRegisteredItemsByUser(userId, pageable));
        result.put("faved", itemUserActionRepository.findFavedItemsByUser(userId, pageable));
        result.put("rated", itemUserActionRepository.findRatedItemsByUser(userId, pageable));
        return result;
    }

    public Map<String, Object> userInfo(User user) {
        var children = userRepository.findByUserIdAndIsChild(user.getId(), (byte) 1);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", new UserInfoResponse(user));
        result.put("children", children.stream().map(UserInfoResponse::new).toList());
        return result;
    }

    public Map<String, Object> userInfoLess(User user) {
        var children = userRepository.findByUserIdAndIsChild(user.getId(), (byte) 1);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", new UserInfoResponse(user));
        result.put("children", children.stream().map(UserInfoResponse::new).toList());
        result.put("cartcount", 0);
        result.put("hasPendingOrder", false);
        return result;
    }

    // ── Edit profile ──────────────────────────────────────────────────────────

    public UserInfoResponse editProfile(Map<String, Object> body, User user) {
        // Allowed fields (phone is NOT allowed to change)
        if (body.containsKey("name") && body.get("name") != null)
            user.setName(body.get("name").toString());
        if (body.containsKey("email"))
            user.setEmail(body.get("email") != null ? body.get("email").toString() : null);
        if (body.containsKey("introduce"))
            user.setIntroduce(body.get("introduce") != null ? body.get("introduce").toString() : null);
        if (body.containsKey("address"))
            user.setAddress(body.get("address") != null ? body.get("address").toString() : null);
        if (body.containsKey("title"))
            user.setTitle(body.get("title") != null ? body.get("title").toString() : null);
        if (body.containsKey("fullContent"))
            user.setFullContent(body.get("fullContent") != null ? body.get("fullContent").toString() : null);
        if (body.containsKey("dob") && body.get("dob") != null) {
            try { user.setDob(LocalDate.parse(body.get("dob").toString())); } catch (Exception ignored) {}
        }
        if (body.containsKey("sex"))
            user.setSex(body.get("sex") != null ? body.get("sex").toString() : null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("editProfile: user {} updated", user.getId());
        return new UserInfoResponse(user);
    }

    // ── Change password ───────────────────────────────────────────────────────

    public void changePassword(String oldPass, String newPass, User user) {
        if (!passwordEncoder.matches(oldPass, user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }
        user.setPassword(passwordEncoder.encode(newPass));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("changePassword: user {} changed password", user.getId());
    }

    // ── Children ──────────────────────────────────────────────────────────────

    public List<UserInfoResponse> getChildren(User user) {
        return userRepository.findByUserIdAndIsChild(user.getId(), (byte) 1)
                .stream().map(UserInfoResponse::new).toList();
    }

    public UserInfoResponse saveChild(Map<String, Object> body, User user) {
        Object idObj = body.get("id");
        Long childId = idObj != null && !idObj.toString().equals("0") ? Long.parseLong(idObj.toString()) : null;

        if (childId != null) {
            // Update existing child
            User child = userRepository.findById(childId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản con"));
            if (!user.getId().equals(child.getUserId()) || child.getIsChild() == null || child.getIsChild() != 1) {
                throw new IllegalArgumentException("Không có quyền chỉnh sửa tài khoản này");
            }
            if (body.containsKey("name") && body.get("name") != null)
                child.setName(body.get("name").toString());
            if (body.containsKey("dob") && body.get("dob") != null) {
                try { child.setDob(LocalDate.parse(body.get("dob").toString())); } catch (Exception ignored) {}
            }
            child.setUpdatedAt(LocalDateTime.now());
            userRepository.save(child);
            return new UserInfoResponse(child);
        } else {
            // Create new child
            User child = new User();
            child.setName(body.get("name") != null ? body.get("name").toString() : "Con " + (user.getName()));
            child.setPhone(user.getPhone() + System.currentTimeMillis() % 10000);
            child.setPassword(passwordEncoder.encode(user.getPhone()));
            child.setRole("member");
            child.setIsChild((byte) 1);
            child.setUserId(user.getId());
            child.setWalletM(0L);
            child.setWalletC(0L);
            child.setStatus((byte) 1);
            child.setApiToken(UUID.randomUUID().toString().replace("-", ""));
            if (body.containsKey("dob") && body.get("dob") != null) {
                try { child.setDob(LocalDate.parse(body.get("dob").toString())); } catch (Exception ignored) {}
            }
            child.setCreatedAt(LocalDateTime.now());
            child.setUpdatedAt(LocalDateTime.now());
            userRepository.save(child);
            log.info("saveChild: created child {} for user {}", child.getId(), user.getId());
            return new UserInfoResponse(child);
        }
    }

    public void deleteChild(Long childId, User user) {
        User child = userRepository.findById(childId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản con"));
        if (!user.getId().equals(child.getUserId()) || child.getIsChild() == null || child.getIsChild() != 1) {
            throw new IllegalArgumentException("Không có quyền xóa tài khoản này");
        }
        if (orderDetailRepository.existsByUserId(childId)) {
            throw new IllegalArgumentException("Không thể xóa tài khoản đã có khóa học. Vui lòng liên hệ hỗ trợ.");
        }
        userRepository.delete(child);
        log.info("deleteChild: deleted child {} for user {}", childId, user.getId());
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getUserOrders(User user) {
        var orders = orderRepository.findByUserIdAndStatusInOrderByIdDesc(
                user.getId(),
                List.of(OrderStatus.DELIVERED, OrderStatus.PAY_PENDING, OrderStatus.NEW,
                        OrderStatus.CANCEL_BUYER, OrderStatus.CANCEL_SYSTEM, OrderStatus.RETURN_BUYER, OrderStatus.REFUND)
        );
        var result = new ArrayList<Map<String, Object>>();
        for (Order order : orders) {
            var details = orderDetailRepository.findByOrderId(order.getId());
            var items = new ArrayList<Map<String, Object>>();
            for (OrderDetail d : details) {
                itemRepository.findById(d.getItemId()).ifPresent(item -> {
                    // Find student name
                    String studentName = null;
                    if (d.getUserId() != null && !d.getUserId().equals(user.getId())) {
                        studentName = userRepository.findById(d.getUserId()).map(User::getName).orElse(null);
                    }
                    var row = new LinkedHashMap<String, Object>();
                    row.put("itemId", item.getId());
                    row.put("title", item.getTitle());
                    row.put("image", item.getImage() != null ? item.getImage() : "");
                    row.put("paidPrice", d.getPaidPrice());
                    row.put("studentName", studentName);
                    items.add(row);
                });
            }
            var row = new LinkedHashMap<String, Object>();
            row.put("orderId", String.valueOf(order.getId()));
            row.put("amount", order.getAmount());
            row.put("status", order.getStatus());
            row.put("payment", order.getPayment() != null ? order.getPayment() : "");
            row.put("createdAt", order.getCreatedAt());
            row.put("items", items);
            result.add(row);
        }
        return result;
    }

    // ── Item codes ────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getItemCodes(User user) {
        var codes = itemCodeRepository.findByUserId(user.getId());
        var result = new ArrayList<Map<String, Object>>();
        for (ItemCode code : codes) {
            itemRepository.findById(code.getItemId()).ifPresent(item -> {
                var row = new LinkedHashMap<String, Object>();
                row.put("codeId", code.getId());
                row.put("code", code.getCode());
                row.put("itemId", item.getId());
                row.put("itemTitle", item.getTitle());
                row.put("itemImage", item.getImage() != null ? item.getImage() : "");
                row.put("subtype", item.getSubtype());
                row.put("createdAt", code.getCreatedAt());
                result.add(row);
            });
        }
        return result;
    }

    // ── anyPoint (wallet_c) history ───────────────────────────────────────────

    private static final List<String> WALLET_C_TYPES = List.of("commission", "commission_add", "activitybonus", "exchange", "exchange_refund");

    public List<Map<String, Object>> getWalletCHistory(User user) {
        var txns = transactionRepository.findByUserIdAndTypeIn(user.getId(), WALLET_C_TYPES);
        var result = new ArrayList<Map<String, Object>>();
        for (var t : txns) {
            var row = new LinkedHashMap<String, Object>();
            row.put("id", t.getId());
            row.put("type", t.getType());
            row.put("amount", t.getAmount());
            row.put("status", t.getStatus());
            row.put("content", t.getContent());
            row.put("createdAt", t.getCreatedAt());
            result.add(row);
        }
        return result;
    }

    // ── Update image URL (after S3 upload) ───────────────────────────────────

    public UserInfoResponse updateImageUrl(String type, String imageUrl, User user) {
        if ("avatar".equals(type)) user.setImage(imageUrl);
        else if ("banner".equals(type)) user.setBanner(imageUrl);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return new UserInfoResponse(user);
    }
}
