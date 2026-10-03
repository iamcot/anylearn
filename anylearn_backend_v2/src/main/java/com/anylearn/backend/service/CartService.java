package com.anylearn.backend.service;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderDetail;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final ItemUserActionRepository itemUserActionRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemSchedulePlanRepository itemSchedulePlanRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final TransactionRepository transactionRepository;
    private final ConfigurationRepository configurationRepository;
    private final ConfigService configService;
    private final ObjectMapper objectMapper;

    private static final int POINT_RATE = 1000; // 1 anyPoint = 1,000 VND

    private double getConfig(String key, double def) {
        return configurationRepository.findByKey(key)
                .map(c -> { try { return Double.parseDouble(c.getValue()); } catch (Exception e) { return def; } })
                .orElse(def);
    }

    public Map<String, Object> getCartInfo(Long itemId, User currentUser) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khóa học"));

        List<?> enrichedList = configService.getItemsByIds(List.of(itemId));
        Object enrichedItem = enrichedList.isEmpty() ? Map.of(
                "id", item.getId(), "title", item.getTitle(), "price", item.getPrice(),
                "orgPrice", item.getOrgPrice(), "image", item.getImage(),
                "dateStart", item.getDateStart(), "nolimitTime", item.getNolimitTime()
        ) : enrichedList.get(0);

        List<User> children = userRepository.findByUserIdAndIsChild(currentUser.getId(), (byte) 1);
        List<Map<String, Object>> childrenInfo = children.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName() != null ? c.getName() : "");
            m.put("image", c.getImage());
            return m;
        }).toList();

        List<Map<String, Object>> plans = itemSchedulePlanRepository.findPlansWithLocation(itemId);
        List<Map<String, Object>> categories = itemCategoryRepository.findCategoriesByItemId(itemId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("item", enrichedItem);
        result.put("children", childrenInfo);
        result.put("plans", plans);
        result.put("categories", categories);
        result.put("activiyTrial", item.getActiviyTrial() != null && item.getActiviyTrial() == 1);
        result.put("activiyTest",  item.getActiviyTest()  != null && item.getActiviyTest()  == 1);
        result.put("activiyVisit", item.getActiviyVisit() != null && item.getActiviyVisit() == 1);
        result.put("authorId", item.getUserId());
        User author = userRepository.findById(item.getUserId()).orElse(null);
        result.put("authorName", author != null ? author.getName() : "");
        return result;
    }

    public Map<String, Object> addToCart(Long itemId, Long studentId, Long planId,
                                          String trialType, String trialDate, String trialNote,
                                          User currentUser) {
        List<ItemUserAction> existing = findCartItems(currentUser.getId());
        boolean duplicate = existing.stream().anyMatch(a -> {
            if (!a.getItemId().equals(itemId)) return false;
            try {
                Map<?, ?> ev = objectMapper.readValue(a.getExtraValue() != null ? a.getExtraValue() : "{}", Map.class);
                Object sid = ev.get("studentId");
                if (studentId == null) return sid == null;
                return studentId.toString().equals(String.valueOf(sid));
            } catch (Exception e) { return false; }
        });
        if (duplicate) throw new IllegalArgumentException("Khóa học này đã có trong giỏ hàng.");

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("studentId", studentId);
        extra.put("planId", planId);
        extra.put("trialType", trialType);
        extra.put("trialDate", trialDate);
        extra.put("trialNote", trialNote);

        ItemUserAction action = new ItemUserAction();
        action.setItemId(itemId);
        action.setUserId(currentUser.getId());
        action.setType("cart");
        action.setValue("1");
        try { action.setExtraValue(objectMapper.writeValueAsString(extra)); } catch (Exception ignored) {}
        action.setCreatedAt(LocalDateTime.now());
        action.setUpdatedAt(LocalDateTime.now());
        itemUserActionRepository.save(action);

        long cartCount = findCartItems(currentUser.getId()).size();
        return Map.of("cartItemId", action.getId(), "cartCount", cartCount);
    }

    public List<Map<String, Object>> getCart(User currentUser) {
        List<ItemUserAction> cartItems = findCartItems(currentUser.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (ItemUserAction action : cartItems) {
            Item item = itemRepository.findById(action.getItemId()).orElse(null);
            if (item == null) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("cartItemId", action.getId());
            row.put("itemId", item.getId());
            row.put("title", item.getTitle());
            row.put("image", item.getImage());
            row.put("price", item.getPrice());
            row.put("orgPrice", item.getOrgPrice());
            row.put("dateStart", item.getDateStart());
            userRepository.findById(item.getUserId()).ifPresent(u -> row.put("authorName", u.getName()));
            try {
                if (action.getExtraValue() != null) {
                    Map<?, ?> extra = objectMapper.readValue(action.getExtraValue(), Map.class);
                    Object sid = extra.get("studentId");
                    if (sid != null) {
                        userRepository.findById(Long.parseLong(String.valueOf(sid)))
                                .ifPresent(s -> row.put("studentName", s.getName()));
                    }
                    row.put("extra", extra);
                }
            } catch (Exception ignored) {}
            result.add(row);
        }
        return result;
    }

    public void removeCartItem(Long actionId, User currentUser) {
        ItemUserAction action = itemUserActionRepository.findById(actionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy item giỏ hàng"));
        if (!action.getUserId().equals(currentUser.getId()))
            throw new IllegalArgumentException("Không có quyền xóa item này");
        itemUserActionRepository.delete(action);
    }

    public Map<String, Object> checkout(String paymentMethod, String couponCode,
                                         Integer pointsUsed, User currentUser) {
        List<ItemUserAction> cartItems = findCartItems(currentUser.getId());
        if (cartItems.isEmpty()) throw new IllegalArgumentException("Giỏ hàng trống");

        // Build item list and calculate total
        long totalAmount = 0;
        List<Item> items = new ArrayList<>();
        for (ItemUserAction cartItem : cartItems) {
            itemRepository.findById(cartItem.getItemId()).ifPresent(item -> {
                items.add(item);
            });
        }
        for (Item item : items) totalAmount += item.getPrice() != null ? item.getPrice() : 0;

        // Create Order
        Order order = new Order();
        order.setUserId(currentUser.getId());
        order.setQuantity(items.size());
        order.setAmount(totalAmount);
        order.setStatus(OrderStatus.NEW);
        order.setPayment(paymentMethod);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // Create OrderDetail + pending_reg for each cart item
        List<Map<String, Object>> orderedItems = new ArrayList<>();
        for (ItemUserAction cartItem : cartItems) {
            Item item = items.stream().filter(i -> i.getId().equals(cartItem.getItemId())).findFirst().orElse(null);
            if (item == null) continue;

            OrderDetail detail = new OrderDetail();
            detail.setOrderId(order.getId());
            detail.setItemId(item.getId());
            detail.setUnitPrice(item.getPrice() != null ? item.getPrice() : 0L);
            detail.setPaidPrice(item.getPrice() != null ? item.getPrice() : 0L);
            detail.setQuanity(1);
            detail.setStatus(OrderStatus.NEW);
            detail.setCreatedAt(LocalDateTime.now());
            detail.setUpdatedAt(LocalDateTime.now());
            // Extract studentId and planId from cart extra
            Long studentIdForDetail = null;
            try {
                if (cartItem.getExtraValue() != null) {
                    Map<?, ?> extra = objectMapper.readValue(cartItem.getExtraValue(), Map.class);
                    Object planId = extra.get("planId");
                    if (planId != null) detail.setItemSchedulePlanId(Long.parseLong(String.valueOf(planId)));
                    Object sid = extra.get("studentId");
                    if (sid != null) studentIdForDetail = Long.parseLong(String.valueOf(sid));
                }
            } catch (Exception ignored) {}
            // Store student's userId on OrderDetail (for student name lookup)
            detail.setUserId(studentIdForDetail != null ? studentIdForDetail : currentUser.getId());
            orderDetailRepository.save(detail);

            // Save enrollment data as pending_reg (used by PaymentApprovalService to create "reg" IUAs)
            Map<String, Object> extraData = new LinkedHashMap<>();
            try {
                if (cartItem.getExtraValue() != null) {
                    Map<?, ?> cartExtra = objectMapper.readValue(cartItem.getExtraValue(), Map.class);
                    cartExtra.forEach((k, v) -> { if (k instanceof String key) extraData.put(key, v); });
                }
            } catch (Exception ignored) {}
            extraData.put("orderId", String.valueOf(order.getId()));
            extraData.put("orderDetailId", detail.getId());
            extraData.put("paymentMethod", paymentMethod);
            if (couponCode != null) extraData.put("couponCode", couponCode);
            if (pointsUsed != null) extraData.put("pointsUsed", pointsUsed);

            ItemUserAction pendingReg = new ItemUserAction();
            pendingReg.setItemId(item.getId());
            pendingReg.setUserId(currentUser.getId());
            pendingReg.setType("pending_reg");
            pendingReg.setValue(String.valueOf(order.getId()));
            try { pendingReg.setExtraValue(objectMapper.writeValueAsString(extraData)); } catch (Exception ignored) {}
            pendingReg.setCreatedAt(LocalDateTime.now());
            pendingReg.setUpdatedAt(LocalDateTime.now());
            itemUserActionRepository.save(pendingReg);

            // Create pending commission transactions (approved later when payment confirmed)
            createPendingCommissions(order, detail, item, currentUser);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("itemId", item.getId());
            row.put("title", item.getTitle());
            row.put("price", item.getPrice());
            row.put("image", item.getImage());
            row.put("dateStart", item.getDateStart());
            orderedItems.add(row);
        }

        itemUserActionRepository.deleteAll(cartItems);

        // Deduct anyPoints from wallet_c and create pending transaction
        if (pointsUsed != null && pointsUsed > 0) {
            User user = userRepository.findById(currentUser.getId()).orElse(currentUser);
            long maxDeductible = user.getWalletC() != null ? user.getWalletC() : 0;
            long deductPoints = Math.min(pointsUsed, maxDeductible);
            if (deductPoints > 0) {
                user.setWalletC(maxDeductible - deductPoints);
                userRepository.save(user);

                Transaction pointsTx = new Transaction();
                pointsTx.setUserId(currentUser.getId());
                pointsTx.setType("exchange");
                pointsTx.setAmount(-deductPoints);
                pointsTx.setPayMethod(paymentMethod);
                pointsTx.setOrderId(order.getId());
                pointsTx.setContent("Dùng " + deductPoints + " anyPoint cho đơn hàng #" + order.getId());
                pointsTx.setStatus(0); // pending — confirmed when payment completes
                pointsTx.setCreatedAt(LocalDateTime.now());
                pointsTx.setUpdatedAt(LocalDateTime.now());
                transactionRepository.save(pointsTx);
                log.info("checkout: deducted {} anyPoints for order {}", deductPoints, order.getId());
            }
        }

        return Map.of("orderId", String.valueOf(order.getId()), "items", orderedItems, "paymentMethod", paymentMethod);
    }

    public Map<String, Object> getOrder(String orderId, User currentUser) {
        long orderIdLong;
        try { orderIdLong = Long.parseLong(orderId); }
        catch (NumberFormatException e) {
            return Map.of("orderId", orderId, "items", List.of(), "paymentMethod", "");
        }

        Order order = orderRepository.findByIdAndUserId(orderIdLong, currentUser.getId()).orElse(null);
        if (order == null) return Map.of("orderId", orderId, "items", List.of(), "paymentMethod", "");

        List<OrderDetail> details = orderDetailRepository.findByOrderId(orderIdLong);
        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderDetail detail : details) {
            itemRepository.findById(detail.getItemId()).ifPresent(item -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("itemId", item.getId());
                row.put("title", item.getTitle());
                row.put("price", detail.getPaidPrice());
                row.put("image", item.getImage());
                row.put("dateStart", item.getDateStart());
                row.put("seoUrl", item.getSeoUrl());
                items.add(row);
            });
        }
        return Map.of(
                "orderId", orderId,
                "items", items,
                "paymentMethod", order.getPayment() != null ? order.getPayment() : "",
                "status", order.getStatus()
        );
    }

    private void createPendingCommissions(Order order, OrderDetail detail, Item item, User buyer) {
        long price = item.getPrice() != null ? item.getPrice() : 0L;
        if (price <= 0) return;

        double bonusRate  = getConfig("bonus_rate", 1000.0);
        double discRate   = getConfig("discount", 0.1);
        double commRate   = getConfig("commission", 0.2);
        int    friendTree = (int) getConfig("friend_tree", 2.0);

        // Determine commission rate: item override > author rate > system default
        double itemCommRate;
        if (item.getCommissionRate() != null && item.getCommissionRate() == -1.0) {
            return; // explicitly disabled for this item
        } else if (item.getCommissionRate() != null && item.getCommissionRate() > 0) {
            itemCommRate = item.getCommissionRate();
        } else {
            var author = userRepository.findById(item.getUserId()).orElse(null);
            itemCommRate = (author != null && author.getCommissionRate() != null && author.getCommissionRate() > 0)
                    ? author.getCommissionRate() : commRate;
        }

        // 1. Partner (author/teacher) commission → wallet_c pending
        long authorAmt = (long) Math.floor(price * itemCommRate / bonusRate);
        if (authorAmt > 0) {
            saveTx(item.getUserId(), "partner", authorAmt, "wallet_c", detail.getId(),
                    "Doanh thu từ bán khóa học: " + item.getTitle());
        }

        // 2. Buyer commission (anyPoint reward) pending
        long buyerAmt = (long) Math.floor(price * itemCommRate * discRate / bonusRate);
        if (buyerAmt > 0) {
            String childSuffix = "";
            if (detail.getUserId() != null && !detail.getUserId().equals(buyer.getId())) {
                childSuffix = userRepository.findById(detail.getUserId())
                        .map(u -> " [" + u.getName() + "]").orElse("");
            }
            saveTx(buyer.getId(), "commission", buyerAmt, "wallet_c", detail.getId(),
                    "Nhận điểm từ khóa học đã mua: " + item.getTitle() + childSuffix);
        }

        // 3. Referral chain (up to friendTree levels)
        long refAmt = (long) Math.floor(price * itemCommRate * commRate / bonusRate);
        if (refAmt > 0) {
            Long currentUserId = buyer.getUserId();
            for (int i = 0; i < friendTree && currentUserId != null; i++) {
                var refUser = userRepository.findById(currentUserId).orElse(null);
                if (refUser == null) break;
                saveTx(currentUserId, "commission", refAmt, "wallet_c", detail.getId(),
                        "Nhận điểm từ " + buyer.getName() + " mua khóa học: " + item.getTitle());
                currentUserId = refUser.getUserId();
            }
        }

        log.info("[checkout] pending commissions created for detail {} item {}", detail.getId(), item.getId());
    }

    private Transaction saveTx(Long userId, String type, long amount, String payMethod,
                                Long orderId, String content) {
        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setType(type);
        tx.setAmount(amount);
        tx.setPayMethod(payMethod);
        tx.setOrderId(orderId);
        tx.setContent(content);
        tx.setStatus(0); // pending
        tx.setCreatedAt(LocalDateTime.now());
        tx.setUpdatedAt(LocalDateTime.now());
        return transactionRepository.save(tx);
    }

    private List<ItemUserAction> findCartItems(Long userId) {
        return itemUserActionRepository.findCartByUser(userId);
    }
}
