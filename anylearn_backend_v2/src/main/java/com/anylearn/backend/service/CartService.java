package com.anylearn.backend.service;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {

    private final ItemUserActionRepository itemUserActionRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemSchedulePlanRepository itemSchedulePlanRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final ConfigService configService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getCartInfo(Long itemId, User currentUser) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khóa học"));

        // Enrich item via ConfigService
        List<?> enrichedList = configService.getItemsByIds(List.of(itemId));
        Object enrichedItem = enrichedList.isEmpty() ? Map.of(
                "id", item.getId(), "title", item.getTitle(), "price", item.getPrice(),
                "orgPrice", item.getOrgPrice(), "image", item.getImage(),
                "dateStart", item.getDateStart(), "nolimitTime", item.getNolimitTime()
        ) : enrichedList.get(0);

        // Children
        List<User> children = userRepository.findByUserIdAndIsChild(currentUser.getId(), (byte) 1);
        List<Map<String, Object>> childrenInfo = children.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName() != null ? c.getName() : "");
            m.put("image", c.getImage());
            return m;
        }).toList();

        // Plans
        List<Map<String, Object>> plans = itemSchedulePlanRepository.findPlansWithLocation(itemId);

        // Categories
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
        // Prevent duplicate cart entry for same item + student
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
            // Author
            userRepository.findById(item.getUserId()).ifPresent(u -> row.put("authorName", u.getName()));
            // Extra metadata (studentId, planId, etc.)
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

        String orderId = currentUser.getId() + "_" + System.currentTimeMillis();

        List<Map<String, Object>> orderedItems = new ArrayList<>();
        for (ItemUserAction cartItem : cartItems) {
            Map<String, Object> orderExtra = new LinkedHashMap<>();
            orderExtra.put("orderId", orderId);
            orderExtra.put("paymentMethod", paymentMethod);
            if (couponCode != null) orderExtra.put("couponCode", couponCode);
            if (pointsUsed != null) orderExtra.put("pointsUsed", pointsUsed);
            try {
                if (cartItem.getExtraValue() != null) {
                    Map<?, ?> cartExtra = objectMapper.readValue(cartItem.getExtraValue(), Map.class);
                    cartExtra.forEach((k, v) -> {
                        if (k instanceof String key) orderExtra.put(key, v);
                    });
                }
            } catch (Exception ignored) {}

            ItemUserAction reg = new ItemUserAction();
            reg.setItemId(cartItem.getItemId());
            reg.setUserId(currentUser.getId());
            reg.setType("reg");
            reg.setValue("1");
            try { reg.setExtraValue(objectMapper.writeValueAsString(orderExtra)); } catch (Exception ignored) {}
            reg.setCreatedAt(LocalDateTime.now());
            reg.setUpdatedAt(LocalDateTime.now());
            itemUserActionRepository.save(reg);

            itemRepository.findById(cartItem.getItemId()).ifPresent(item -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("itemId", item.getId());
                row.put("title", item.getTitle());
                row.put("price", item.getPrice());
                row.put("image", item.getImage());
                row.put("dateStart", item.getDateStart());
                orderedItems.add(row);
            });
        }

        // Clear cart
        itemUserActionRepository.deleteAll(cartItems);

        return Map.of("orderId", orderId, "items", orderedItems, "paymentMethod", paymentMethod);
    }

    public Map<String, Object> getOrder(String orderId, User currentUser) {
        List<ItemUserAction> regItems = itemUserActionRepository.findRegsByOrderId(currentUser.getId(), orderId);
        List<Map<String, Object>> items = new ArrayList<>();
        String paymentMethod = null;
        for (ItemUserAction reg : regItems) {
            Map<String, Object> row = new LinkedHashMap<>();
            try {
                if (reg.getExtraValue() != null) {
                    Map<?, ?> extra = objectMapper.readValue(reg.getExtraValue(), Map.class);
                    if (paymentMethod == null) paymentMethod = (String) extra.get("paymentMethod");
                }
            } catch (Exception ignored) {}
            itemRepository.findById(reg.getItemId()).ifPresent(item -> {
                row.put("itemId", item.getId());
                row.put("title", item.getTitle());
                row.put("price", item.getPrice());
                row.put("image", item.getImage());
                row.put("dateStart", item.getDateStart());
                row.put("seoUrl", item.getSeoUrl());
                items.add(row);
            });
        }
        return Map.of("orderId", orderId, "items", items,
                "paymentMethod", paymentMethod != null ? paymentMethod : "");
    }

    private List<ItemUserAction> findCartItems(Long userId) {
        return itemUserActionRepository.findCartByUser(userId);
    }
}
