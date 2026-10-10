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
    private final ConfigService configService;
    private final OrderDetailRepository orderDetailRepository;

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
        Map<String, Object> authorInfo = author == null ? null : new LinkedHashMap<>(Map.of(
                "id", author.getId(),
                "name", author.getName() != null ? author.getName() : "",
                "role", author.getRole() != null ? author.getRole() : "",
                "image", author.getImage() != null ? author.getImage() : "",
                "introduce", author.getIntroduce() != null ? author.getIntroduce() : "",
                "isHot", author.getIsHot() != null ? author.getIsHot() : 0
        ));

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
        boolean hasPurchased = currentUser != null &&
                orderDetailRepository.existsDeliveredByUserIdAndItemId(currentUser.getId(), itemId) > 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("item", item);
        result.put("num_favorite", numFav);
        result.put("num_cart", numCart);
        result.put("rating", rating);
        result.put("author", authorInfo);
        result.put("categories", itemCategoryRepository.findCategoriesByItemId(itemId));
        result.put("teachers", classTeacherRepository.findTeachersByClassAndOwner(itemId, item.getUserId()));
        result.put("reviews", reviews);
        result.put("plans", new ArrayList<>(plansGrouped.values()));
        result.put("num_schedule", rawPlans.size());
        result.put("is_fav", isFav);
        result.put("has_purchased", hasPurchased);
        // Author items
        List<Long> authorItemIds = itemRepository.findByAuthor(item.getUserId(), itemId, PageRequest.of(0, 8))
                .stream().map(Item::getId).toList();
        List<?> authorItems = authorItemIds.isEmpty() ? List.of() : configService.getItemsByIds(authorItemIds);

        // Similar items via Meilisearch: same title keywords + categories + subtype
        List<String> categoryUrls = itemCategoryRepository.findAllCategoryUrlsByItemId(itemId);
        List<Long> similarIds = meilisearchService.findSimilarIds(itemId, item.getUserId(), item.getTitle(), categoryUrls, item.getSubtype(), 10);
        List<?> hotItems = similarIds.isEmpty() ? List.of() : configService.getItemsByIds(similarIds);

        result.put("authorItems", authorItems);
        result.put("hotItems", hotItems);
        result.put("url", "Khoá học " + item.getTitle() + " cực hay trên anyLEARN bạn có biết chưa");

        return result;
    }

    private List<Map<String, Object>> getReviews(Long itemId) {
        // Using raw query via ItemUserActionRepository for join with users
        return itemUserActionRepository.findReviewsByItemId(itemId);
    }
}
