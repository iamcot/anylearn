package com.anylearn.backend.service;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final com.anylearn.backend.service.reviews.ReviewService reviewService;
    private final ItemSchedulePlanRepository itemSchedulePlanRepository;
    private final ItemScheduleRepository itemScheduleRepository;
    private final ClassTeacherRepository classTeacherRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final MeilisearchService meilisearchService;
    private final ConfigService configService;
    private final OrderDetailRepository orderDetailRepository;

    public Map<String, Object> pdpData(Long itemId, User currentUser) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Trang không tồn tại"));

        User author = userRepository.findById(item.getUserId()).orElse(null);
        boolean visible = author != null && com.anylearn.backend.service.search.ItemVisibility.isVisible(
                item.getStatus(), item.getUserStatus(), author.getStatus(), author.getIsSigned());
        if (!visible && !mayOpenHiddenItem(item, currentUser)) throw new IllegalArgumentException("Trang không tồn tại");
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
                orderDetailRepository.existsDeliveredForBuyerOrLearner(currentUser.getId(), itemId) > 0;

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
        result.put("schedules", itemScheduleRepository.findByItemIdAndStatus(itemId, (byte) 1));
        result.put("enrolled_count", orderDetailRepository.countDeliveredByItemId(itemId));
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

    /** A course that is not shown to visitors can still be opened by the back office, its partner and people who bought it. */
    private boolean mayOpenHiddenItem(Item item, User viewer) {
        if (viewer == null) return false;
        if ("admin".equals(viewer.getRole()) || item.getUserId().equals(viewer.getId())) return true;
        return orderDetailRepository.existsDeliveredForBuyerOrLearner(viewer.getId(), item.getId()) > 0;
    }

    private List<Map<String, Object>> getReviews(Long itemId) {
        // Using raw query via ItemUserActionRepository for join with users
        return reviewService.list(itemId, false, null, false);
    }
}
