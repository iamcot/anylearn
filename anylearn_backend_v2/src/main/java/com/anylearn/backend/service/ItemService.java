package com.anylearn.backend.service;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final ItemSchedulePlanRepository itemSchedulePlanRepository;
    private final ClassTeacherRepository classTeacherRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final MeilisearchService meilisearchService;

    public Map<String, Object> pdpData(Long itemId, User currentUser) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Trang không tồn tại"));

        // Auto-shift past date_start
        LocalDate today = LocalDate.now();
        if (item.getDateStart() != null && today.isAfter(item.getDateStart())) {
            if ("extra".equals(item.getSubtype()) || "offline".equals(item.getSubtype())) {
                item.setDateStart(today.plusDays(30));
            } else {
                item.setDateStart(today.plusDays(15));
            }
            item.setDateEnd(null);
            itemRepository.save(item);
            meilisearchService.indexItem(item.getId());
        }

        User author = userRepository.findById(item.getUserId()).orElse(null);

        // Reviews
        List<Map<String, Object>> reviews = getReviews(itemId);

        // Schedule plans grouped by location
        List<Map<String, Object>> rawPlans = itemSchedulePlanRepository.findPlansWithLocation(itemId);
        Map<Object, Map<String, Object>> plansGrouped = new LinkedHashMap<>();
        for (var row : rawPlans) {
            Object locId = row.get("location_id");
            plansGrouped.computeIfAbsent(locId, k -> {
                Map<String, Object> g = new LinkedHashMap<>();
                g.put("location", Map.of(
                        "location_id", locId,
                        "location_title", row.getOrDefault("location_title", ""),
                        "address", row.getOrDefault("address", "")));
                g.put("plans", new ArrayList<Object>());
                return g;
            });
            @SuppressWarnings("unchecked")
            List<Object> plans = (List<Object>) plansGrouped.get(locId).get("plans");
            plans.add(row);
        }

        Long numFav = itemUserActionRepository.countFav(itemId);
        Long numCart = itemUserActionRepository.countReg(itemId);
        Double rating = itemUserActionRepository.avgRating(itemId);

        boolean isFav = currentUser != null &&
                itemUserActionRepository.findFavByItemAndUser(itemId, currentUser.getId()).isPresent();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("item", item);
        result.put("num_favorite", numFav);
        result.put("num_cart", numCart);
        result.put("rating", rating);
        result.put("author", author);
        result.put("categories", itemCategoryRepository.findCategoriesByItemId(itemId));
        result.put("teachers", classTeacherRepository.findTeachersByClassAndOwner(itemId, item.getUserId()));
        result.put("reviews", reviews);
        result.put("plans", new ArrayList<>(plansGrouped.values()));
        result.put("num_schedule", rawPlans.size());
        result.put("is_fav", isFav);
        result.put("hotItems", Map.of(
                "route", "/event",
                "title", "Sản phẩm liên quan",
                "list", itemRepository.findHotItems(itemId, PageRequest.of(0, 5))));
        result.put("url", "Khoá học " + item.getTitle() + " cực hay trên anyLEARN bạn có biết chưa");

        return result;
    }

    private List<Map<String, Object>> getReviews(Long itemId) {
        // Using raw query via ItemUserActionRepository for join with users
        return itemUserActionRepository.findReviewsByItemId(itemId);
    }
}
