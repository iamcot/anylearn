package com.anylearn.backend.controller.item;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.service.ItemService;
import com.anylearn.backend.service.ItemTrackingService;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ItemRepository itemRepository;
    private final S3Service s3Service;
    private final ItemTrackingService itemTrackingService;
    private final ItemUserActionRepository itemUserActionRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final MeilisearchService meilisearchService;

    @GetMapping("/pdp/{id}")
    public ApiResponse<?> pdp(@PathVariable Long id,
                               @AuthenticationPrincipal User currentUser) {
        itemTrackingService.record(id, currentUser != null ? currentUser.getId() : null, "view");
        return ApiResponse.ok(itemService.pdpData(id, currentUser));
    }

    @GetMapping("/item/{itemId}/reviews")
    public ApiResponse<?> reviews(@PathVariable Long itemId) {
        return ApiResponse.ok(itemUserActionRepository.findReviewsByItemId(itemId));
    }

    @GetMapping("/item/{itemId}/is-fav")
    public ApiResponse<?> isFav(@PathVariable Long itemId,
                                @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            var res = new java.util.LinkedHashMap<String, Object>();
            res.put("is_fav", false); res.put("has_purchased", false); res.put("my_rating", null);
            return ApiResponse.ok(res);
        }
        boolean faved = itemUserActionRepository.findFavByItemAndUser(itemId, currentUser.getId()).isPresent();
        boolean purchased = orderDetailRepository.existsDeliveredByUserIdAndItemId(currentUser.getId(), itemId) > 0;
        var existingRating = itemUserActionRepository.findRatingByItemAndUser(itemId, currentUser.getId());

        var res = new java.util.LinkedHashMap<String, Object>();
        res.put("is_fav", faved);
        res.put("has_purchased", purchased);
        res.put("num_favorite", itemUserActionRepository.countFav(itemId));
        if (existingRating.isPresent()) {
            var r = existingRating.get();
            res.put("my_rating", Map.of(
                "value", r.getValue(),
                "comment", r.getExtraValue() != null ? r.getExtraValue() : ""
            ));
        } else {
            res.put("my_rating", null);
        }
        return ApiResponse.ok(res);
    }

    @GetMapping("/item/{itemId}/touch-fav")
    public ApiResponse<?> touchFav(@PathVariable Long itemId,
                                   @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return ApiResponse.fail("Unauthorized");
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return ApiResponse.fail("Không tìm thấy khóa học");

        var existing = itemUserActionRepository.findFavByItemAndUser(itemId, currentUser.getId());
        boolean faved;
        if (existing.isPresent()) {
            itemUserActionRepository.delete(existing.get());
            faved = false;
        } else {
            var action = new ItemUserAction();
            action.setItemId(itemId);
            action.setUserId(currentUser.getId());
            action.setType("fav");
            action.setValue("1");
            action.setCreatedAt(LocalDateTime.now());
            action.setUpdatedAt(LocalDateTime.now());
            itemUserActionRepository.save(action);
            faved = true;
        }
        meilisearchService.updateItemPopularityScoreAsync(item);
        long numFav = itemUserActionRepository.countFav(itemId);
        return ApiResponse.ok(Map.of("faved", faved, "num_favorite", numFav));
    }

    @PostMapping("/item/{itemId}/save-rating")
    public ApiResponse<?> saveRating(@PathVariable Long itemId,
                                     @RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return ApiResponse.fail("Unauthorized");
        if (orderDetailRepository.existsDeliveredByUserIdAndItemId(currentUser.getId(), itemId) == 0) {
            return ApiResponse.fail("Bạn chưa mua khóa học này");
        }
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return ApiResponse.fail("Không tìm thấy khóa học");

        int rating = body.get("rating") instanceof Number n ? n.intValue() : 0;
        String comment = body.get("comment") instanceof String s ? s : "";
        if (rating < 1 || rating > 5) return ApiResponse.fail("Rating phải từ 1 đến 5");

        // Upsert: find existing rating by this user for this item
        ItemUserAction action = itemUserActionRepository
                .findRatingByItemAndUser(itemId, currentUser.getId())
                .orElseGet(ItemUserAction::new);
        action.setItemId(itemId);
        action.setUserId(currentUser.getId());
        action.setType("rating");
        action.setValue(String.valueOf(rating));
        action.setExtraValue(comment);
        action.setUpdatedAt(LocalDateTime.now());
        if (action.getCreatedAt() == null) action.setCreatedAt(LocalDateTime.now());
        itemUserActionRepository.save(action);

        meilisearchService.updateItemPopularityScoreAsync(item);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @GetMapping("/user/{userId}/items")
    public ApiResponse<?> userItems(@PathVariable Long userId) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/create")
    public ApiResponse<?> create(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/update")
    public ApiResponse<?> update(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/updateitem")
    public ApiResponse<?> updateItem(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/{id}/edit")
    public ApiResponse<?> edit(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{id}/edit")
    public ApiResponse<?> save(@PathVariable Long id, @RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/list")
    public ApiResponse<?> list() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{itemId}/upload-image")
    public ApiResponse<?> uploadImage(@PathVariable Long itemId, @RequestParam MultipartFile file,
                                       @AuthenticationPrincipal User user) {
        try {
            String url = s3Service.uploadImage(file, "items/" + itemId);
            itemRepository.findById(itemId).ifPresent(item -> {
                if (user != null && ("admin".equals(user.getRole()) || user.getId().equals(item.getUserId()))) {
                    item.setImage(url);
                    itemRepository.save(item);
                }
            });
            return ApiResponse.ok(Map.of("url", url));
        } catch (Exception e) {
            return ApiResponse.fail("Upload ảnh thất bại: " + e.getMessage());
        }
    }

    @GetMapping("/item/{itemId}/user-status/{newStatus}")
    public ApiResponse<?> changeUserStatus(@PathVariable Long itemId, @PathVariable Integer newStatus) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/schadule/{id}")
    public ApiResponse<?> schadule(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/update-schadule")
    public ApiResponse<?> updateSchedule(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/location")
    public ApiResponse<?> userLocation() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{id}/share")
    public ApiResponse<?> share(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }
}
