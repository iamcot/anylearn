package com.anylearn.backend.service;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemActivity;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderDetail;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import com.anylearn.backend.service.points.CommissionConfig;
import com.anylearn.backend.service.points.PointsBreakdown;
import com.anylearn.backend.service.points.PointsEngine;
import com.anylearn.backend.service.NotificationService;
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
    private final ItemScheduleRepository itemScheduleRepository;
    private final ItemActivityRepository itemActivityRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final TransactionRepository transactionRepository;
    private final ConfigurationRepository configurationRepository;
    private final ConfigService configService;
    private final PointsEngine pointsEngine;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final ItemTrackingService itemTrackingService;

    private static final int POINT_RATE = 1000; // 1 anyPoint = 1,000 VND (kept for reference)

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
            m.put("dob", c.getDob());
            return m;
        }).toList();

        List<Map<String, Object>> plans = itemSchedulePlanRepository.findPlansWithLocation(itemId);
        List<ItemSchedule> itemSchedules = itemScheduleRepository.findByItemIdAndStatus(itemId, (byte) 1);
        List<Map<String, Object>> categories = itemCategoryRepository.findCategoriesByItemId(itemId);

        Map<String, Object> result = new LinkedHashMap<>();
        // Merge cycleType/cycleAmount into the enriched item map
        Map<String, Object> itemMap = new LinkedHashMap<>();
        if (enrichedItem instanceof Map<?, ?> em) {
            em.forEach((k, v) -> itemMap.put(String.valueOf(k), v));
        }
        itemMap.put("cycleType", item.getCycleType());
        itemMap.put("cycleAmount", item.getCycleAmount());
        result.put("item", itemMap);
        result.put("children", childrenInfo);
        result.put("plans", plans);
        result.put("schedules", itemSchedules);
        result.put("categories", categories);
        result.put("activiyTrial", item.getActiviyTrial() != null && item.getActiviyTrial() == 1);
        result.put("activiyTest",  item.getActiviyTest()  != null && item.getActiviyTest()  == 1);
        result.put("activiyVisit", item.getActiviyVisit() != null && item.getActiviyVisit() == 1);
        result.put("authorId", item.getUserId());
        User author = userRepository.findById(item.getUserId()).orElse(null);
        result.put("authorName", author != null ? author.getName() : "");
        return result;
    }

    public Map<String, Object> addToCart(Long itemId, Long studentId, Long planId, Long scheduleId,
                                          Object activities, String startDate,
                                          String trialType, String trialDate, String trialNote,
                                          User currentUser) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khóa học."));

        // Enrollment deadline check: if not continuous enrollment, block when all schedules have started
        boolean isNolimit = "1".equals(item.getNolimitTime());
        if (!isNolimit) {
            List<ItemSchedule> schedules = itemScheduleRepository.findByItemIdAndStatus(itemId, (byte) 1);
            if (!schedules.isEmpty()) {
                java.time.LocalDate today = java.time.LocalDate.now();
                boolean anyUpcoming = schedules.stream().anyMatch(s -> {
                    if ("event".equals(s.getScheduleType()))
                        return s.getEventDate() != null && !s.getEventDate().isBefore(today);
                    if ("open".equals(s.getScheduleType()))
                        return true; // open = flexible start, always allow
                    return s.getDateStart() == null || !s.getDateStart().isBefore(today);
                });
                if (!anyUpcoming)
                    throw new IllegalArgumentException("Khóa học này đã hết hạn đăng ký.");
            } else if (item.getDateStart() != null && item.getDateStart().isBefore(java.time.LocalDate.now())) {
                // fallback to item.dateStart if no schedules defined
                throw new IllegalArgumentException("Khóa học này đã hết hạn đăng ký.");
            }
        }

        // ── Enrollment rules ──────────────────────────────────────────────────
        Long studentUserId = (studentId != null) ? studentId : currentUser.getId();

        // Rule 1: Re-registration
        if (item.getAllowReRegister() != null && item.getAllowReRegister() == 0) {
            if (orderDetailRepository.existsDeliveredByUserIdAndItemId(studentUserId, itemId) > 0)
                throw new IllegalArgumentException("Bạn đã đăng ký khóa học này rồi.");
        }

        // Rule 2: Age range
        if (item.getAgesMin() != null || item.getAgesMax() != null) {
            var student = userRepository.findById(studentUserId).orElse(null);
            if (student != null && student.getDob() != null) {
                int age = java.time.Period.between(student.getDob(), java.time.LocalDate.now()).getYears();
                if (item.getAgesMin() != null && age < item.getAgesMin())
                    throw new IllegalArgumentException("Học sinh chưa đủ tuổi (tối thiểu " + item.getAgesMin() + " tuổi).");
                if (item.getAgesMax() != null && age > item.getAgesMax())
                    throw new IllegalArgumentException("Học sinh vượt quá độ tuổi (tối đa " + item.getAgesMax() + " tuổi).");
            }
        }

        // Rule 3: Seat capacity
        if (item.getSeats() != null && item.getSeats() > 0) {
            int enrolled = orderDetailRepository.countDeliveredByItemId(itemId);
            if (enrolled >= item.getSeats())
                throw new IllegalArgumentException("Khóa học đã đủ số chỗ (" + item.getSeats() + " chỗ).");
        }
        // ─────────────────────────────────────────────────────────────────────

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
        extra.put("scheduleId", scheduleId);
        if (startDate != null && !startDate.isBlank()) extra.put("startDate", startDate);
        // activities array (new); fallback to legacy single-activity fields
        if (activities != null) {
            extra.put("activities", activities);
        } else if (trialType != null) {
            extra.put("activities", List.of(Map.of(
                    "type", trialType,
                    "date", trialDate != null ? trialDate : "",
                    "note", trialNote != null ? trialNote : "")));
        }

        ItemUserAction action = new ItemUserAction();
        action.setItemId(itemId);
        action.setUserId(currentUser.getId());
        action.setType("cart");
        action.setValue("1");
        try { action.setExtraValue(objectMapper.writeValueAsString(extra)); } catch (Exception ignored) {}
        action.setCreatedAt(LocalDateTime.now());
        action.setUpdatedAt(LocalDateTime.now());
        itemUserActionRepository.save(action);
        itemTrackingService.record(itemId, currentUser.getId(), "cart");

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
                    Object schId = extra.get("scheduleId");
                    if (schId != null) {
                        itemScheduleRepository.findById(Long.parseLong(String.valueOf(schId))).ifPresent(sch -> {
                            row.put("scheduleTitle", sch.getTitle());
                            row.put("scheduleTime", buildScheduleTime(sch));
                        });
                    }
                    // expose activities array for checkout display
                    if (extra.get("activities") instanceof List<?> acts) row.put("activities", acts);
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

            // Save activities to item_activities table
            Long actStudentId = studentIdForDetail != null ? studentIdForDetail : currentUser.getId();
            Object acts = extraData.get("activities");
            if (acts instanceof List<?> actList) {
                for (Object actObj : actList) {
                    if (!(actObj instanceof Map<?,?> act)) continue;
                    String actType = act.get("type") instanceof String t ? t : null;
                    if (actType == null) continue;
                    ItemActivity ia = new ItemActivity();
                    ia.setItemId(item.getId());
                    ia.setUserId(actStudentId);
                    ia.setType(actType);
                    ia.setDate(act.get("date") instanceof String d && !d.isBlank() ? d : null);
                    ia.setNote(act.get("note") instanceof String n && !n.isBlank() ? n : null);
                    ia.setStatus((byte) 0);
                    ia.setCreatedAt(LocalDateTime.now());
                    ia.setUpdatedAt(LocalDateTime.now());
                    itemActivityRepository.save(ia);
                }
            }

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

        // Notify admins so they can review and approve
        notifyAdminsNewOrder(order, currentUser, orderedItems);
        notifyAdminsActivityRegistrations(currentUser, cartItems);

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
                pointsTx.setStatus(1); // immediate — wallet_c already deducted, exchange is instant
                pointsTx.setCreatedAt(LocalDateTime.now());
                pointsTx.setUpdatedAt(LocalDateTime.now());
                transactionRepository.save(pointsTx);
                log.info("checkout: deducted {} anyPoints for order {}", deductPoints, order.getId());
            }
        }

        return Map.of("orderId", String.valueOf(order.getId()), "items", orderedItems, "paymentMethod", paymentMethod);
    }

    private void notifyAdminsNewOrder(Order order, User buyer, List<Map<String, Object>> orderedItems) {
        String itemNames = orderedItems.stream()
                .map(i -> (String) i.get("title"))
                .limit(2)
                .reduce((a, b) -> a + ", " + b)
                .orElse("") + (orderedItems.size() > 2 ? " +" + (orderedItems.size() - 2) + " khác" : "");
        String content = "Đơn #" + order.getId() + " · " + (buyer.getName() != null ? buyer.getName() : buyer.getPhone())
                + " · " + itemNames;
        userRepository.findByRole("admin").forEach(admin -> {
            try {
                notificationService.createNotification(admin.getId(), "system_notif",
                        "Đơn hàng mới cần duyệt", content, "/admin/orders", null);
            } catch (Exception e) {
                log.warn("[checkout] failed to notify admin {}: {}", admin.getId(), e.getMessage());
            }
        });
    }

    @SuppressWarnings("unchecked")
    private void notifyAdminsActivityRegistrations(User buyer, List<ItemUserAction> cartItems) {
        for (ItemUserAction cartItem : cartItems) {
            try {
                if (cartItem.getExtraValue() == null) continue;
                Map<?, ?> extra = objectMapper.readValue(cartItem.getExtraValue(), Map.class);
                Object activitiesObj = extra.get("activities");
                if (!(activitiesObj instanceof List<?> acts) || acts.isEmpty()) continue;
                String itemTitle = itemRepository.findById(cartItem.getItemId())
                        .map(Item::getTitle).orElse("Khóa học");
                String buyerName = buyer.getName() != null ? buyer.getName() : buyer.getPhone();
                for (Object actObj : acts) {
                    if (!(actObj instanceof Map<?,?> act)) continue;
                    String type = act.get("type") instanceof String t ? t : null;
                    if (type == null) continue;
                    String date = act.get("date") instanceof String d && !d.isBlank() ? d : null;
                    String typeLabel = switch (type) {
                        case "trial" -> "Học thử"; case "test" -> "Test đầu vào"; default -> "Tham quan";
                    };
                    String content = buyerName + " đăng ký " + typeLabel + " · " + itemTitle
                            + (date != null ? " · " + date : "");
                    userRepository.findByRole("admin").forEach(admin -> {
                        try {
                            notificationService.createNotification(admin.getId(), "activity_registration",
                                    "Đăng ký hoạt động mới", content, "/admin/activities", null);
                        } catch (Exception ignored) {}
                    });
                }
            } catch (Exception ignored) {}
        }
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
        // Look up pending_reg records for schedule/student info
        List<ItemUserAction> regs = itemUserActionRepository.findRegsByOrderId(currentUser.getId(), String.valueOf(orderIdLong));
        java.util.function.Function<Long, Map<?,?>> getRegExtra = (itemId) -> regs.stream()
                .filter(r -> r.getItemId().equals(itemId)).findFirst()
                .map(r -> { try { return objectMapper.readValue(r.getExtraValue(), Map.class); } catch (Exception e) { return null; } })
                .orElse(null);

        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderDetail detail : details) {
            itemRepository.findById(detail.getItemId()).ifPresent(item -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("itemId", item.getId());
                row.put("title", item.getTitle());
                row.put("price", detail.getPaidPrice());
                row.put("image", item.getImage());
                row.put("seoUrl", item.getSeoUrl());
                // Enrich from pending_reg extra (schedule + student)
                Map<?,?> extra = getRegExtra.apply(item.getId());
                if (extra != null) {
                    Object sid = extra.get("studentId");
                    if (sid != null) userRepository.findById(Long.parseLong(String.valueOf(sid)))
                            .ifPresent(s -> row.put("studentName", s.getName()));
                    Object schId = extra.get("scheduleId");
                    if (schId != null) itemScheduleRepository.findById(Long.parseLong(String.valueOf(schId)))
                            .ifPresent(sch -> { row.put("scheduleTitle", sch.getTitle()); row.put("scheduleTime", buildScheduleTime(sch)); });
                }
                // Load activities from item_activities table
                List<Map<String, Object>> acts = itemActivityRepository
                        .findByItemIdAndUserId(item.getId(), detail.getUserId()).stream()
                        .<Map<String, Object>>map(ia -> { var m = new LinkedHashMap<String, Object>(); m.put("type", ia.getType()); m.put("date", ia.getDate()); m.put("note", ia.getNote()); return m; })
                        .toList();
                if (!acts.isEmpty()) row.put("activities", acts);
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

        // Load global config
        Map<String, String> configMap = new java.util.HashMap<>();
        configurationRepository.findAll().forEach(c -> configMap.put(c.getKey(), c.getValue()));
        CommissionConfig baseConfig = CommissionConfig.fromMap(configMap);

        // Merge per-item company_commission JSON overrides
        CommissionConfig config = pointsEngine.mergeCompanyCommission(baseConfig, item.getCompanyCommission());

        // Resolve effective commission rate: item > author > system default
        User author = userRepository.findById(item.getUserId()).orElse(null);
        double commRate = pointsEngine.resolveCommissionRate(
                item.getCommissionRate(),
                author != null ? author.getCommissionRate() : null,
                config.commission()
        );

        // Count buyer's referral chain depth
        int referralDepth = 0;
        Long walkId = buyer.getUserId();
        for (int i = 0; i < config.friendTree() && walkId != null; i++) {
            User ref = userRepository.findById(walkId).orElse(null);
            if (ref == null) break;
            referralDepth++;
            walkId = ref.getUserId();
        }

        // Check if author's referrer qualifies for refSeller bonus
        boolean authorHasRefSeller = author != null
                && author.getUserId() != null
                && Boolean.TRUE.equals(author.getGetRefSeller());

        // Calculate distribution (pure, no DB side-effects)
        PointsBreakdown bd = pointsEngine.calculate(price, commRate, config, referralDepth, authorHasRefSeller);

        // When commissions disabled (rate=-1), company keeps full price; skip point txs
        if (!bd.disabled()) {
            // 1. Author/teacher → wallet_c pending
            if (bd.authorPoints() > 0 && author != null) {
                saveTx(author.getId(), null, "partner", bd.authorPoints(), "wallet_c", detail.getId(),
                        "Doanh thu từ bán khóa học: " + item.getTitle() + ", tỉ lệ " + fmtRate(commRate));
            }

            // 2. Buyer direct reward → wallet_c pending
            if (bd.buyerPoints() > 0) {
                String label = item.getTitle();
                if (detail.getUserId() != null && !detail.getUserId().equals(buyer.getId())) {
                    label += userRepository.findById(detail.getUserId())
                            .map(u -> " [" + u.getName() + "]").orElse("");
                }
                saveTx(buyer.getId(), null, "commission", bd.buyerPoints(), "wallet_c", detail.getId(),
                        "Nhận điểm từ khóa học đã mua: " + label);
            }

            // 3. Referral chain → wallet_c pending (one transaction per level)
            Long currentUserId = buyer.getUserId();
            for (int i = 0; i < bd.referralAmounts().size() && currentUserId != null; i++) {
                long refAmt = bd.referralAmounts().get(i);
                User refUser = userRepository.findById(currentUserId).orElse(null);
                if (refUser == null) break;
                if (refAmt > 0) {
                    saveTx(currentUserId, buyer.getId(), "commission", refAmt, "wallet_c", detail.getId(),
                            "Nhận điểm từ " + buyer.getName() + " mua khóa học: " + item.getTitle());
                }
                currentUserId = refUser.getUserId();
            }

            // 4. RefSeller → author's referrer wallet_c pending
            if (bd.refSellerPoints() > 0 && author != null && author.getUserId() != null) {
                saveTx(author.getUserId(), author.getId(), "commission", bd.refSellerPoints(), "wallet_c", detail.getId(),
                        "Thưởng giới thiệu đối tác: " + item.getTitle());
            }

            // 5. Foundation → pending accounting (approved with order, no wallet_c credit)
            if (bd.foundationPoints() > 0) {
                saveTx(buyer.getId(), null, "foundation", bd.foundationPoints(), "wallet_c", detail.getId(),
                        "Quỹ vận hành từ đơn hàng #" + order.getId() + ": " + item.getTitle());
            }
        }

        // 6. Company net revenue → pending (approved with order, stored as VND, no wallet_c credit)
        if (bd.companyRevenueVnd() > 0) {
            saveTx(buyer.getId(), null, "net_revenue", bd.companyRevenueVnd(), "company", detail.getId(),
                    "Doanh thu ròng từ đơn hàng #" + order.getId() + ": " + item.getTitle() + ", tỉ lệ đối tác " + fmtRate(commRate));
        }

        log.info("[checkout] commissions created detail={} item={} commRate={} author={}pts buyer={}pts revenueVnd={}",
                detail.getId(), item.getId(), commRate, bd.authorPoints(), bd.buyerPoints(), bd.companyRevenueVnd());
    }

    private Transaction saveTx(Long userId, Long refUserId, String type, long amount, String payMethod,
                                Long orderId, String content) {
        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setRefUserId(refUserId);
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

    private String fmtRate(double rate) {
        int pct = (int) Math.round(rate * 100);
        return pct + "%";
    }

    private static final java.util.Map<String, String> WD_VN = java.util.Map.of(
            "mon","Thứ Hai","tue","Thứ Ba","wed","Thứ Tư",
            "thu","Thứ Năm","fri","Thứ Sáu","sat","Thứ Bảy","sun","Chủ Nhật");

    private String buildScheduleTime(com.anylearn.backend.entity.ItemSchedule s) {
        if ("event".equals(s.getScheduleType()) && s.getEventDate() != null) {
            return s.getEventDate() + (s.getTimeStart() != null ? " · " + s.getTimeStart() : "");
        }
        var sb = new StringBuilder();
        if (s.getWeekdays() != null) {
            String days = java.util.Arrays.stream(s.getWeekdays().split(","))
                    .map(d -> WD_VN.getOrDefault(d.trim(), d.trim()))
                    .collect(java.util.stream.Collectors.joining(", "));
            sb.append(days);
        }
        if (s.getTimeStart() != null) sb.append(sb.length() > 0 ? " · " : "").append(s.getTimeStart());
        if (s.getDateStart() != null) sb.append(sb.length() > 0 ? " · từ " : "từ ").append(s.getDateStart());
        return sb.toString();
    }
}
