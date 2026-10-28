package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.fun.CheckinService;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.FunRules;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizGameService;
import com.anylearn.backend.service.quiz.QuizItems;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.sticker.RiskService;
import com.anylearn.backend.service.sticker.StickerService;
import com.anylearn.backend.service.sticker.WelcomePackService;
import jakarta.servlet.http.HttpServletRequest;
import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.achievement.AchievementSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The Vui học page (plan 14): daily check-in gift. Login needed. */
@RestController
@RequestMapping("/api/fun")
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class FunController {

    private final CheckinService checkinService;
    private final CoinService coinService;
    private final FunSettings funSettings;
    private final RiskService riskService;
    private final StickerService stickerService;
    private final WelcomePackService welcomePackService;
    private final NotificationService notificationService;
    private final AchievementService achievementService;
    private final AchievementSettings achievementSettings;
    private final com.anylearn.backend.service.fun.FunAccessSettings accessSettings;
    private final QuizGameService quizGame;
    private final GameEventService gameEvents;

    @GetMapping("/checkin")
    public ApiResponse<?> checkin(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(checkinService.status(user.getId()));
    }

    /** The balance of the game currency and its last movements. */
    @GetMapping("/coins")
    public ApiResponse<?> coins(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coinName", funSettings.coinName());
        out.put("balance", coinService.balance(user.getId()));
        out.put("history", coinService.history(user.getId(), 20));
        return ApiResponse.ok(out);
    }

    /** Which Vui học games this person may use (a game in trial is open to a small group only). */
    @GetMapping("/access")
    public ApiResponse<?> access(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(accessSettings.allowedFor(user));
    }

    /** The whole ledger of the game currency, paged (the page "Lịch sử" of the wallet). */
    @GetMapping("/coins/history")
    public ApiResponse<?> coinHistory(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Map<String, Object> out = new LinkedHashMap<>(coinService.historyPage(user.getId(), page, size));
        out.put("coinName", funSettings.coinName());
        out.put("balance", coinService.balance(user.getId()));
        return ApiResponse.ok(out);
    }

    @PostMapping("/checkin/claim")
    public ApiResponse<?> claim(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            Map<String, Object> result = new LinkedHashMap<>(checkinService.claim(user.getId()));
            if (Boolean.FALSE.equals(result.get("alreadyClaimed"))) {
                result.put("sticker", stickerAfterClaim(user.getId(), result));
                result.put("item", itemAfterClaim(user.getId(), result));
                result.put("achievement", streakAchievement(user.getId(), result));
            }
            return ApiResponse.ok(result);
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    /** On the streak days of `fun/checkin_item_days` the check-in also gives one random quiz item, outside the claim's transaction. */
    private Map<String, Object> itemAfterClaim(Long userId, Map<String, Object> result) {
        try {
            int day = result.get("dayInCycle") instanceof Number n ? n.intValue() : 0;
            if (!FunRules.itemOn(funSettings.checkinItemDays(), day)) return null;
            List<String> given = quizGame.grantRandomItems(userId, 1, "checkin", "day" + day);
            if (given.isEmpty()) return null;
            String key = given.get(0);
            gameEvents.record(userId, GameEventService.GAME_CHECKIN, "item", key, 0);
            return Map.of("key", key, "label", QuizItems.LABELS.getOrDefault(key, key));
        } catch (Exception e) {
            log.warn("[checkin] item part failed for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /** A banner when the streak reaches a milestone; the token goes back so the page can offer to share it. */
    private String streakAchievement(Long userId, Map<String, Object> result) {
        try {
            int streak = result.get("streak") instanceof Number n ? n.intValue() : 0;
            if (!AchievementRules.isMilestone(streak, achievementSettings.streakDays())) return null;
            return achievementService.grant(userId, AchievementRules.STREAK, "streak:" + streak,
                    "Điểm danh " + streak + " ngày liên tiếp", "Chuỗi " + streak + " ngày cùng Leo", "streak");
        } catch (Exception e) {
            log.warn("[checkin] achievement failed for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /** Sticker part of a claim, outside the claim's transaction: it can never undo the points. */
    private Map<String, Object> stickerAfterClaim(Long userId, Map<String, Object> result) {
        try {
            boolean lastDay = Integer.valueOf(FunRules.CYCLE).equals(result.get("dayInCycle"));
            Map<String, Object> sticker = stickerService.dropForCheckin(userId, lastDay);
            welcomePackService.onCheckin(userId);
            if (sticker != null) {
                notificationService.createNotification(userId, "sticker_drop", "Bạn nhận được sticker mới",
                        "Sticker " + sticker.get("name") + " vừa vào album của bạn.", "/fun/sticker");
            }
            return sticker;
        } catch (Exception e) {
            log.warn("[checkin] sticker part failed for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /** The app sends a random id of the browser once per session; it only feeds the sticker risk score. */
    @PostMapping("/device")
    public ApiResponse<?> device(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
        riskService.recordDevice(user.getId(), body.get("deviceId") instanceof String s ? s : null, ip);
        return ApiResponse.ok(Map.of("ok", true));
    }
}
