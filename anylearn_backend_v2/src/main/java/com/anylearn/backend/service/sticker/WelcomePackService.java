package com.anylearn.backend.service.sticker;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.fun.GameEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * The welcome pack of a person who registered through a link with the sticker game: one common sticker at once, two more after the second
 * check-in day, never an epic and a rare only by a small chance. The person who invited gets one sticker when the new account is
 * eligible (really played), at most `sticker/invite_month_cap` a month. A pack of a risky account waits in the review queue.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WelcomePackService {

    private static final String ROUTE = "/today/fun/sticker";

    private final JdbcTemplate jdbc;
    private final StickerService stickers;
    private final StickerSettings settings;
    private final RiskService risk;
    private final NotificationService notificationService;
    private final GameEventService gameEvents;

    private final Random random = new Random();

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    /** Part 1, right after registering through an invite. Never blocks a registration. */
    public void start(User inviter, User user) {
        try {
            if (!settings.enabled() || inviter == null || user == null) return;
            int rows = jdbc.update("INSERT IGNORE INTO welcome_packs (user_id, inviter_id) VALUES (?, ?)", user.getId(), inviter.getId());
            if (rows != 1) return;
            List<StickerRules.Weighted> commons = StickerRules.welcomePool(stickers.pool(), false);
            StickerRules.Weighted pick = StickerRules.pickWeighted(commons, random.nextDouble());
            if (pick == null) return;
            stickers.grant(user.getId(), pick.id(), "welcome1", String.valueOf(inviter.getId()), lockUntil());
            jdbc.update("UPDATE welcome_packs SET step1_at = NOW(), updated_at = NOW() WHERE user_id = ?", user.getId());
            Map<String, Object> def = stickers.view(pick.id());
            notificationService.createNotification(user.getId(), "sticker_welcome", "Quà chào mừng từ bạn bè",
                    "Bạn nhận sticker " + def.get("name") + ". Điểm danh thêm 1 ngày nữa để nhận tiếp 2 sticker!", ROUTE);
        } catch (Exception e) {
            log.warn("[welcome-pack] start failed for user {}: {}", user == null ? null : user.getId(), e.getMessage());
        }
    }

    private LocalDateTime lockUntil() {
        int days = settings.number("welcome_lock_days");
        return days <= 0 ? null : stickers.now().plusDays(days);
    }

    /** Called after every check-in: the second day opens part 2 and may settle the reward of the person who invited. */
    public void onCheckin(long userId) {
        try {
            if (!settings.enabled()) return;
            List<Map<String, Object>> packs = jdbc.queryForList("SELECT * FROM welcome_packs WHERE user_id = ?", userId);
            if (packs.isEmpty()) return;
            Map<String, Object> pack = packs.get(0);
            if ("pending".equals(pack.get("status")) && pack.get("step2_at") == null && stickers.checkinDays(userId) >= 2) {
                if (risk.shouldHold(userId, settings.number("hold_score"))) {
                    jdbc.update("UPDATE welcome_packs SET status = 'review', updated_at = NOW() WHERE user_id = ?", userId);
                    gameEvents.record(userId, GameEventService.GAME_STICKER, "welcome_hold", "Gói quà đợt 2 chờ duyệt (điểm rủi ro cao)", 0);
                } else {
                    grantPart2(userId, ((Number) pack.get("inviter_id")).longValue());
                }
            }
            settleInviter(userId);
        } catch (Exception e) {
            log.warn("[welcome-pack] check-in hook failed for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional
    void grantPart2(long userId, long inviterId) {
        List<StickerRules.Weighted> all = stickers.pool();
        StickerRules.Weighted first = StickerRules.pickWeighted(StickerRules.welcomePool(all, false), random.nextDouble());
        boolean rare = random.nextInt(100) < settings.number("welcome_rare_chance");
        StickerRules.Weighted second = StickerRules.pickWeighted(StickerRules.welcomePool(all, rare), random.nextDouble());
        List<String> names = new ArrayList<>();
        for (StickerRules.Weighted w : new StickerRules.Weighted[]{first, second}) {
            if (w == null) continue;
            stickers.grant(userId, w.id(), "welcome2", String.valueOf(inviterId), lockUntil());
            names.add(String.valueOf(stickers.view(w.id()).get("name")));
        }
        jdbc.update("UPDATE welcome_packs SET step2_at = NOW(), status = 'done', updated_at = NOW() WHERE user_id = ?", userId);
        if (!names.isEmpty()) {
            notificationService.createNotification(userId, "sticker_welcome", "Quà chào mừng đợt 2",
                    "Bạn nhận thêm " + String.join(" và ", names) + ". Chúc bạn sưu tầm vui!", ROUTE);
        }
    }

    /** The inviter's reward: once per invited account, when that account is eligible, and under the monthly cap. */
    void settleInviter(long invitedId) {
        List<Map<String, Object>> packs = jdbc.queryForList("SELECT inviter_id FROM welcome_packs WHERE user_id = ? AND status = 'done' AND inviter_rewarded = 0", invitedId);
        if (packs.isEmpty() || !stickers.eligible(invitedId)) return;
        long inviter = ((Number) packs.get(0).get("inviter_id")).longValue();
        if (!stickers.eligible(inviter) || risk.blocked(inviter)) return;
        int month = count("SELECT COUNT(*) FROM sticker_grants WHERE user_id = ? AND source = 'invite' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')", inviter);
        if (month >= settings.number("invite_month_cap")) return;
        if (jdbc.update("UPDATE welcome_packs SET inviter_rewarded = 1, updated_at = NOW() WHERE user_id = ? AND inviter_rewarded = 0", invitedId) != 1) return;
        Map<String, Object> def = stickers.dropRandom(inviter, "invite", String.valueOf(invitedId));
        if (def != null) {
            notificationService.createNotification(inviter, "sticker_invite", "Bạn bè của bạn đã chơi!",
                    "Người bạn mời đã hoàn thành gói quà. Bạn nhận sticker " + def.get("name") + ".", ROUTE);
        }
    }

    /** Nightly: invited accounts that became eligible after their second check-in. */
    @Scheduled(cron = "0 10 3 * * *")
    public void settleAll() {
        try {
            for (Long id : jdbc.queryForList("SELECT user_id FROM welcome_packs WHERE status = 'done' AND inviter_rewarded = 0 LIMIT 500", Long.class)) settleInviter(id);
        } catch (Exception e) {
            log.warn("[welcome-pack] nightly settle failed: {}", e.getMessage());
        }
    }

    public List<Map<String, Object>> reviewQueue() {
        return jdbc.queryForList("SELECT p.user_id AS userId, u.name AS userName, u.phone AS userPhone, p.inviter_id AS inviterId, i.name AS inviterName, " +
                "p.created_at AS createdAt FROM welcome_packs p LEFT JOIN users u ON u.id = p.user_id LEFT JOIN users i ON i.id = p.inviter_id " +
                "WHERE p.status = 'review' ORDER BY p.created_at");
    }

    @Transactional
    public void approve(long userId) {
        List<Map<String, Object>> packs = jdbc.queryForList("SELECT inviter_id FROM welcome_packs WHERE user_id = ? AND status = 'review'", userId);
        if (packs.isEmpty()) throw new IllegalStateException("Không có gói quà nào đang chờ duyệt cho người này");
        grantPart2(userId, ((Number) packs.get(0).get("inviter_id")).longValue());
        risk.setStatus(userId, "cleared");
        gameEvents.record(userId, GameEventService.GAME_STICKER, "welcome_approved", "Admin duyệt gói quà đợt 2", 0);
        settleInviter(userId);
    }

    @Transactional
    public void cancel(long userId) {
        int rows = jdbc.update("UPDATE welcome_packs SET status = 'cancelled', updated_at = NOW() WHERE user_id = ? AND status = 'review'", userId);
        if (rows != 1) throw new IllegalStateException("Không có gói quà nào đang chờ duyệt cho người này");
        gameEvents.record(userId, GameEventService.GAME_STICKER, "welcome_cancelled", "Admin hủy gói quà đợt 2", 0);
    }

    /** What the person sees about their own pack and about the people they invited. */
    public Map<String, Object> summaryOf(long userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Map<String, Object>> own = jdbc.queryForList("SELECT status, step1_at, step2_at FROM welcome_packs WHERE user_id = ?", userId);
        if (!own.isEmpty()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("status", own.get(0).get("status"));
            m.put("part1", own.get(0).get("step1_at") != null);
            m.put("part2", own.get(0).get("step2_at") != null);
            out.put("pack", m);
        }
        out.put("invited", count("SELECT COUNT(*) FROM welcome_packs WHERE inviter_id = ?", userId));
        out.put("invitedDone", count("SELECT COUNT(*) FROM welcome_packs WHERE inviter_id = ? AND inviter_rewarded = 1", userId));
        out.put("monthCap", settings.number("invite_month_cap"));
        return out;
    }
}
