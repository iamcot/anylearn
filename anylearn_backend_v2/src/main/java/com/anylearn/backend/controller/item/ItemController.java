package com.anylearn.backend.controller.item;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemActivity;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemActivityRepository;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.ItemService;
import com.anylearn.backend.service.ItemTrackingService;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.S3Service;
import com.anylearn.backend.service.reviews.ReviewRules;
import com.anylearn.backend.service.reviews.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ReviewService reviewService;
    private final ItemRepository itemRepository;
    private final S3Service s3Service;
    private final ItemTrackingService itemTrackingService;
    private final ItemUserActionRepository itemUserActionRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final MeilisearchService meilisearchService;
    private final ItemActivityRepository itemActivityRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final com.anylearn.backend.service.reviews.ReviewSettings reviewSettings;

    @GetMapping("/pdp/{id}")
    public ApiResponse<?> pdp(@PathVariable Long id,
                               @AuthenticationPrincipal User currentUser) {
        itemTrackingService.record(id, currentUser != null ? currentUser.getId() : null, "view");
        return ApiResponse.ok(itemService.pdpData(id, currentUser));
    }

    @GetMapping("/item/{itemId}/reviews")
    public ApiResponse<?> reviews(@PathVariable Long itemId,
                                  @RequestParam(required = false) Integer stars,
                                  @RequestParam(defaultValue = "false") boolean photos) {
        return ApiResponse.ok(reviewService.list(itemId, false, stars, photos));
    }

    @GetMapping("/item/{itemId}/review-summary")
    public ApiResponse<?> reviewSummary(@PathVariable Long itemId) {
        return ApiResponse.ok(reviewService.summary(itemId));
    }

    /** What a review earns, so the form can say it before the parent writes. */
    @GetMapping("/review-rewards")
    public ApiResponse<?> reviewRewards() {
        return ApiResponse.ok(Map.of("textPoints", reviewSettings.pointsForText(), "mediaPoints", reviewSettings.pointsForMedia(),
                "minTextLength", com.anylearn.backend.service.reviews.ReviewRewardRules.MIN_TEXT_LENGTH));
    }

    @PostMapping("/item/{itemId}/review-media")
    public ApiResponse<?> uploadReviewMedia(@PathVariable Long itemId,
                                            @RequestParam("file") MultipartFile file,
                                            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return ApiResponse.fail("Unauthorized");
        if (reviewService.deliveredOrderId(currentUser.getId(), itemId) == null) return ApiResponse.fail("Chỉ phụ huynh đã đăng ký khóa này mới gửi ảnh được");
        String type = file.getContentType();
        if (type == null || !type.startsWith("image/")) return ApiResponse.fail("Chỉ nhận ảnh");
        try {
            return ApiResponse.ok(Map.of("url", s3Service.uploadImage(file, "reviews/" + itemId)));
        } catch (Exception e) {
            return ApiResponse.fail("Upload ảnh thất bại: " + e.getMessage());
        }
    }

    @PostMapping("/item/{itemId}/reviews/{reviewId}/reply")
    public ApiResponse<?> replyToReview(@PathVariable Long itemId, @PathVariable Long reviewId,
                                        @RequestBody Map<String, Object> body,
                                        @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return ApiResponse.fail("Unauthorized");
        String problem = reviewService.reply(currentUser.getId(), "admin".equals(currentUser.getRole()), itemId, reviewId,
                body.get("text") instanceof String text ? text : "");
        return problem == null ? ApiResponse.ok("OK") : ApiResponse.fail(problem);
    }

    @DeleteMapping("/item/{itemId}/reviews/{reviewId}/reply")
    public ApiResponse<?> deleteReviewReply(@PathVariable Long itemId, @PathVariable Long reviewId,
                                            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return ApiResponse.fail("Unauthorized");
        String problem = reviewService.deleteReply(currentUser.getId(), "admin".equals(currentUser.getRole()), itemId, reviewId);
        return problem == null ? ApiResponse.ok("OK") : ApiResponse.fail(problem);
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
        boolean purchased = orderDetailRepository.existsDeliveredForBuyerOrLearner(currentUser.getId(), itemId) > 0;
        var existingRating = itemUserActionRepository.findRatingByItemAndUser(itemId, currentUser.getId());

        var res = new java.util.LinkedHashMap<String, Object>();
        res.put("is_fav", faved);
        res.put("has_purchased", purchased);
        res.put("num_favorite", itemUserActionRepository.countFav(itemId));
        if (existingRating.isPresent()) {
            var r = existingRating.get();
            var mine = reviewService.list(itemId, true, null, false).stream()
                    .filter(review -> r.getId().equals(((Number) review.get("id")).longValue())).findFirst().orElse(Map.of());
            var myRating = new java.util.LinkedHashMap<String, Object>();
            myRating.put("value", r.getValue());
            myRating.put("comment", r.getExtraValue() != null ? r.getExtraValue() : "");
            myRating.put("scores", mine.getOrDefault("scores", Map.of()));
            myRating.put("media", mine.getOrDefault("media", List.of()));
            res.put("my_rating", myRating);
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
        Integer rating = body.get("rating") instanceof Number n ? n.intValue() : null;
        if (rating != null && (rating < 1 || rating > 5)) return ApiResponse.fail("Rating phải từ 1 đến 5");
        var scores = ReviewRules.cleanScores(body.get("scores") instanceof Map<?, ?> map ? map : null);
        List<String> media = body.containsKey("media")
                ? ReviewRules.cleanMedia(body.get("media") instanceof List<?> list ? list : null, reviewService::isOwnUrl) : null;
        var saved = reviewService.save(currentUser.getId(), itemId,
                new ReviewService.Submission(rating, body.get("comment") instanceof String text ? text : "", scores, media));
        return saved.problem() == null ? ApiResponse.ok(Map.of("ok", true, "pointsGiven", saved.pointsGiven())) : ApiResponse.fail(saved.problem());
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

    @GetMapping("/item/{itemId}/my-activities")
    public ApiResponse<?> myActivities(@PathVariable Long itemId,
                                        @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.ok(List.of());
        return ApiResponse.ok(itemActivityRepository.findByItemIdAndUserId(itemId, user.getId()));
    }

    @PostMapping("/item/{itemId}/register-activity")
    public ApiResponse<?> registerActivity(@PathVariable Long itemId,
                                            @RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return ApiResponse.fail("Không tìm thấy khóa học");

        Object actsObj = body.get("activities");
        if (!(actsObj instanceof List<?> actList) || actList.isEmpty())
            return ApiResponse.fail("Không có hoạt động nào");

        String itemTitle = item.getTitle();
        String buyerName = user.getName() != null ? user.getName() : user.getPhone();

        for (Object actObj : actList) {
            if (!(actObj instanceof Map<?,?> act)) continue;
            String actType = act.get("type") instanceof String t ? t : null;
            if (actType == null) continue;
            ItemActivity ia = new ItemActivity();
            ia.setItemId(itemId);
            ia.setUserId(user.getId());
            ia.setType(actType);
            ia.setDate(act.get("date") instanceof String d && !d.isBlank() ? d : null);
            ia.setNote(act.get("note") instanceof String n && !n.isBlank() ? n : null);
            ia.setStatus((byte) 0);
            ia.setCreatedAt(LocalDateTime.now());
            ia.setUpdatedAt(LocalDateTime.now());
            itemActivityRepository.save(ia);

            String typeLabel = switch (actType) {
                case "trial" -> "Học thử"; case "test" -> "Test đầu vào"; default -> "Tham quan";
            };
            String date = ia.getDate() != null ? " · " + ia.getDate() : "";
            final String content = buyerName + " đăng ký " + typeLabel + " · " + itemTitle + date;
            userRepository.findAdminNotificationRecipients().forEach(admin -> {
                try {
                    notificationService.createNotification(admin.getId(), "activity_registration",
                            "Đăng ký hoạt động mới", content, "/admin/activities", null);
                } catch (Exception ignored) {}
            });
        }
        return ApiResponse.ok("Đăng ký thành công");
    }

    @PutMapping("/item/{itemId}/my-activities/{activityId}/cancel")
    public ApiResponse<?> cancelActivity(@PathVariable Long itemId,
                                          @PathVariable Long activityId,
                                          @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return itemActivityRepository.findById(activityId).map(ia -> {
            if (!ia.getUserId().equals(user.getId()) || !ia.getItemId().equals(itemId))
                return ApiResponse.fail("Không có quyền");
            ia.setStatus((byte) -1);
            ia.setUpdatedAt(LocalDateTime.now());
            itemActivityRepository.save(ia);
            // Notify admins
            Item item = itemRepository.findById(itemId).orElse(null);
            String itemTitle = item != null ? item.getTitle() : "Khóa học";
            String typeLabel = switch (ia.getType()) {
                case "trial" -> "Học thử"; case "test" -> "Test đầu vào"; default -> "Tham quan";
            };
            String buyerName = user.getName() != null ? user.getName() : user.getPhone();
            final String content = buyerName + " hủy đăng ký " + typeLabel + " · " + itemTitle;
            userRepository.findAdminNotificationRecipients().forEach(admin -> {
                try {
                    notificationService.createNotification(admin.getId(), "activity_registration",
                            "Hủy đăng ký hoạt động", content, "/admin/activities", null);
                } catch (Exception ignored) {}
            });
            return ApiResponse.ok("Đã hủy");
        }).orElse(ApiResponse.fail("Không tìm thấy"));
    }
}
