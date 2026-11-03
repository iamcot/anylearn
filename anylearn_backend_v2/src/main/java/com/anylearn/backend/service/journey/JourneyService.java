package com.anylearn.backend.service.journey;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.foundation.FoundationService;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.settings.NumberSettings;
import com.anylearn.backend.service.sticker.StickerService;
import com.anylearn.backend.service.voucher.VoucherService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/**
 * "Hành trình anyLEARN" (plan 21): checks each mission of {@link JourneyRules} on real data, pays a mission and a
 * chapter once (`journey_claims`), and returns what was paid so the app can play Leo's coin animation.
 * Missions that have no data of their own (installing the app, "Gần tôi", comparing) are `game_events` rows of game
 * `journey`, written by {@link #recordEvent}.
 */
@Service
@Slf4j
public class JourneyService {

    public static final String GAME = "journey";
    public static final String TX_BONUS = "journey_bonus";
    public static final Set<String> EVENTS = Set.of("pwa_install", "near", "compare");
    public static final String VOUCHER_EVENT = "journey_chapter";

    private static final int[] CHAPTER_COINS = {50, 100, 100, 100, 200};

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final NumberSettings settings;

    @Autowired(required = false) private CoinService coins;
    @Autowired(required = false) private FunSettings funSettings;
    @Autowired(required = false) private StickerService stickers;
    @Autowired(required = false) private FoundationService foundation;
    @Autowired(required = false) private AchievementService achievements;
    @Autowired(required = false) private VoucherService vouchers;
    @Autowired(required = false) private WalletService wallet;
    @Autowired(required = false) private TransactionRepository transactions;
    @Autowired(required = false) private GameEventService events;

    public JourneyService(JdbcTemplate jdbc, Clock clock, ConfigurationRepository configurationRepository) {
        this.jdbc = jdbc;
        this.clock = clock;
        NumberSettings s = new NumberSettings(GAME, configurationRepository)
                .field("enabled", "Bật Hành trình anyLEARN (1 = bật, 0 = tắt)", "Chung", 1, 0, 1);
        for (JourneyRules.Chapter c : JourneyRules.CHAPTERS) {
            String group = "Chương " + c.no() + ": " + c.title();
            s.field("chapter" + c.no() + "_coins", "Leo Xu khi xong chương", group, CHAPTER_COINS[c.no() - 1], 0, 100_000);
            if (c.no() == 1) s.field("chapter1_foundation", "Góp quỹ Foundation đứng tên người chơi (đ)", group, 5_000, 0, 10_000_000);
            if (c.no() == 2) s.field("chapter2_points", "anyPoint khi xong chương", group, 0, 0, 100_000);
            if (c.no() == 4) s.field("chapter4_points", "anyPoint khi xong chương", group, 0, 0, 100_000);
            for (JourneyRules.Def d : JourneyRules.DEFS) {
                if (d.chapter() != c.no()) continue;
                s.field(d.key() + "_on", "Bật: " + d.label(), group, 1, 0, 1);
                s.field(d.key() + "_coins", "Leo Xu: " + d.label(), group, d.defCoins(), 0, 100_000);
            }
            if (c.no() == 3) {
                s.field("trial_foundation", "Góp quỹ khi đăng ký học thử (đ)", group, 2_000, 0, 10_000_000);
            }
            if (c.no() == 4) {
                s.field("review_photo_foundation", "Góp quỹ khi viết đánh giá có ảnh (đ)", group, 2_000, 0, 10_000_000);
            }
        }
        this.settings = s;
    }

    public NumberSettings settings() { return settings; }

    public boolean enabled() { return settings.on("enabled"); }

    private Timestamp now() { return Timestamp.valueOf(LocalDateTime.now(clock)); }

    private Set<String> enabledKeys() {
        Set<String> out = new HashSet<>();
        for (JourneyRules.Def d : JourneyRules.DEFS) if (settings.on(d.key() + "_on")) out.add(d.key());
        return out;
    }

    // ── checks ───────────────────────────────────────────────────────────

    private boolean exists(String sql, Object... args) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM (" + sql + " LIMIT 1) x", Long.class, args);
        return n != null && n > 0;
    }

    private boolean event(long userId, String type) {
        return exists("SELECT 1 FROM game_events WHERE user_id = ? AND game = ? AND type = ?", userId, GAME, type);
    }

    public boolean hasOrder(long userId) {
        return exists("SELECT 1 FROM orders WHERE user_id = ? AND status = 'delivered'", userId);
    }

    /** Learners of the account: itself and its children. */
    private String learnerIn() {
        return "(SELECT ? UNION SELECT id FROM users WHERE user_id = ? AND is_child = 1)";
    }

    /** Which missions the account has done (switched-off ones are checked too: they simply never pay). */
    public Set<String> done(long u) {
        Set<String> d = new HashSet<>();
        if (exists("SELECT 1 FROM users WHERE user_id = ? AND is_child = 1 AND dob IS NOT NULL AND COALESCE(dob_year_only, 0) = 0", u)) d.add("add_child");
        if (exists("SELECT 1 FROM learner_interests WHERE learner_id IN " + learnerIn(), u, u)) d.add("interests");
        if (exists("SELECT 1 FROM user_locations WHERE user_id = ? AND status = 1", u)) d.add("home_address");
        if (event(u, "pwa_install") || exists("SELECT 1 FROM push_subscriptions WHERE user_id = ? AND is_standalone = 1", u)) d.add("install_app");
        if (exists("SELECT 1 FROM push_subscriptions WHERE user_id = ?", u)) d.add("notifications");
        if (exists("SELECT 1 FROM ai_suggestions WHERE user_id = ?", u)) d.add("ai_suggest");
        if (event(u, "near")) d.add("near_search");
        if (event(u, "compare")) d.add("compare");
        Long favs = jdbc.queryForObject("SELECT COUNT(DISTINCT item_id) FROM item_user_actions WHERE user_id = ? AND type = 'fav' AND value = '1'", Long.class, u);
        if (favs != null && favs >= 3) d.add("fav3");
        if (exists("SELECT 1 FROM follows WHERE user_id = ?", u)) d.add("follow");
        if (exists("SELECT 1 FROM course_requests WHERE user_id = ?", u)) d.add("course_request");
        if (exists("SELECT 1 FROM item_video_lesson_user_links l JOIN item_video_lessons v ON v.id = l.item_video_lesson_id "
                + "WHERE l.user_id = ? AND v.is_free = 1 AND COALESCE(l.watched_seconds, 0) > 0", u)) d.add("free_lesson");
        if (exists("SELECT 1 FROM item_activities WHERE user_id = ? AND type = 'trial'", u)) d.add("trial");
        if (hasOrder(u)) d.add("first_order");
        if (exists("SELECT 1 FROM session_attendances WHERE status = 'attended' AND learner_id IN " + learnerIn(), u, u)) d.add("attend");
        if (exists("SELECT 1 FROM chat_members WHERE user_id = ? AND rules_accepted_at IS NOT NULL", u)) d.add("chat_rules");
        if (exists("SELECT 1 FROM enrollment_feedback WHERE user_id = ?", u)) d.add("survey");
        if (exists("SELECT 1 FROM item_user_actions a JOIN review_media m ON m.review_id = a.id WHERE a.user_id = ? AND a.type = 'rating'", u)) d.add("review_photo");
        if (exists("SELECT 1 FROM game_events WHERE user_id = ? AND ((game = 'explore' AND type = 'share') OR (game = 'banner' AND type = 'share'))", u)) d.add("share");
        if (exists("SELECT 1 FROM users WHERE user_id = ? AND COALESCE(is_child, 0) = 0", u)) d.add("invite");
        if (exists("SELECT 1 FROM milestone_rewards WHERE user_id = ? AND kind = 'referral_inviter'", u)) d.add("friend_buys");
        return d;
    }

    private Set<String> claimed(long userId) {
        return new HashSet<>(jdbc.queryForList("SELECT mission_key FROM journey_claims WHERE user_id = ?", String.class, userId));
    }

    // ── reading ──────────────────────────────────────────────────────────

    /** The journey of an account; `userId` null = a visitor (everything locked, "Đăng ký để nhận quà"). */
    public Map<String, Object> view(Long userId) {
        boolean on = enabled();
        Set<String> enabled = enabledKeys();
        Set<String> done = userId == null ? Set.of() : done(userId);
        Set<String> claimed = userId == null ? Set.of() : claimed(userId);
        boolean hasOrder = done.contains("first_order");
        int ready = 0;
        List<Map<String, Object>> chapters = new ArrayList<>();
        for (JourneyRules.Chapter c : JourneyRules.CHAPTERS) {
            List<Map<String, Object>> missions = new ArrayList<>();
            int required = 0, requiredDone = 0;
            for (JourneyRules.Def d : JourneyRules.DEFS) {
                if (d.chapter() != c.no() || !enabled.contains(d.key())) continue;
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("key", d.key());
                m.put("label", d.label());
                m.put("hint", d.hint());
                m.put("route", d.route());
                m.put("coins", settings.getInt(d.key() + "_coins"));
                m.put("sticker", d.sticker());
                m.put("optional", d.optional());
                m.put("done", done.contains(d.key()));
                m.put("claimed", claimed.contains(d.key()));
                if (!d.optional()) { required++; if (done.contains(d.key())) requiredDone++; }
                if (done.contains(d.key()) && !claimed.contains(d.key()) && JourneyRules.chapterOpen(c.no(), hasOrder)) ready++;
                missions.add(m);
            }
            Map<String, Object> ch = new LinkedHashMap<>();
            ch.put("no", c.no());
            ch.put("title", c.title());
            ch.put("gift", c.gift());
            ch.put("coins", settings.getInt("chapter" + c.no() + "_coins"));
            ch.put("open", userId != null && JourneyRules.chapterOpen(c.no(), hasOrder));
            ch.put("complete", JourneyRules.chapterComplete(c.no(), done, enabled));
            ch.put("claimed", claimed.contains(JourneyRules.chapterKey(c.no())));
            ch.put("required", required);
            ch.put("requiredDone", requiredDone);
            ch.put("missions", missions);
            chapters.add(ch);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", on);
        out.put("signedIn", userId != null);
        out.put("coinName", funSettings != null ? funSettings.coinName() : "Leo Xu");
        out.put("hasOrder", hasOrder);
        out.put("ready", userId == null ? 0 : ready);
        out.put("chapters", chapters);
        Map<String, Object> next = null;
        if (userId != null) {
            Optional<JourneyRules.Def> n = JourneyRules.next(done, enabled, hasOrder);
            if (n.isPresent()) {
                JourneyRules.Def d = n.get();
                next = new LinkedHashMap<>();
                next.put("key", d.key());
                next.put("chapter", d.chapter());
                next.put("label", d.label());
                next.put("hint", d.hint());
                next.put("route", d.route());
                next.put("coins", settings.getInt(d.key() + "_coins"));
            }
        }
        out.put("next", next);
        return out;
    }

    // ── claiming ─────────────────────────────────────────────────────────

    /**
     * Pays every mission that is done and not yet paid, then every complete chapter. Safe to call often (the app calls it
     * on page changes): each payment is claimed in `journey_claims` first. Returns the rewards paid now.
     */
    public Map<String, Object> claim(long userId) {
        List<Map<String, Object>> rewards = new ArrayList<>();
        if (enabled()) {
            Set<String> enabled = enabledKeys();
            Set<String> done = done(userId);
            Set<String> claimed = claimed(userId);
            boolean hasOrder = done.contains("first_order");
            for (JourneyRules.Def d : JourneyRules.DEFS) {
                if (!enabled.contains(d.key()) || !done.contains(d.key()) || claimed.contains(d.key())) continue;
                if (!JourneyRules.chapterOpen(d.chapter(), hasOrder)) continue;
                if (!claimRow(userId, d.key())) continue;
                try { rewards.add(payMission(userId, d)); }
                catch (Exception e) { log.warn("[journey] pay {} to {} failed: {}", d.key(), userId, e.getMessage()); }
            }
            for (JourneyRules.Chapter c : JourneyRules.CHAPTERS) {
                String key = JourneyRules.chapterKey(c.no());
                if (claimed.contains(key) || !JourneyRules.chapterOpen(c.no(), hasOrder)) continue;
                if (!JourneyRules.chapterComplete(c.no(), done, enabled)) continue;
                if (!claimRow(userId, key)) continue;
                try { rewards.add(payChapter(userId, c)); }
                catch (Exception e) { log.warn("[journey] chapter {} to {} failed: {}", c.no(), userId, e.getMessage()); }
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coinName", funSettings != null ? funSettings.coinName() : "Leo Xu");
        out.put("rewards", rewards);
        return out;
    }

    private boolean claimRow(long userId, String key) {
        return jdbc.update("INSERT IGNORE INTO journey_claims (user_id, mission_key, claimed_at) VALUES (?, ?, ?)", userId, key, now()) == 1;
    }

    private Map<String, Object> payMission(long userId, JourneyRules.Def d) {
        Map<String, Object> r = reward("mission", d.key(), d.label());
        int coinAmount = settings.getInt(d.key() + "_coins");
        credit(userId, coinAmount, "Hành trình: " + d.label());
        r.put("coins", coinAmount);
        if (d.sticker() && stickers != null) r.put("sticker", stickers.dropRandom(userId, GAME, d.key()));
        long brick = switch (d.key()) {
            case "trial" -> settings.get("trial_foundation");
            case "review_photo" -> settings.get("review_photo_foundation");
            default -> 0;
        };
        if (brick > 0 && foundation != null && foundation.milestone(userId, brick, "journey:" + d.key() + ":" + userId, d.label()) > 0) {
            r.put("foundation", brick);
            r.put("foundationLabel", foundation.label(brick));
        }
        if (events != null) events.record(userId, GAME, "mission", d.key(), coinAmount);
        return r;
    }

    private Map<String, Object> payChapter(long userId, JourneyRules.Chapter c) {
        Map<String, Object> r = reward("chapter", JourneyRules.chapterKey(c.no()), "Xong chương " + c.no() + ": " + c.title());
        r.put("chapter", c.no());
        int coinAmount = settings.getInt("chapter" + c.no() + "_coins");
        credit(userId, coinAmount, "Hành trình: xong chương " + c.no());
        r.put("coins", coinAmount);
        switch (c.no()) {
            case 1 -> {
                if (stickers != null) r.put("sticker", stickers.dropRandom(userId, GAME, "chapter1"));
                long brick = settings.get("chapter1_foundation");
                if (brick > 0 && foundation != null && foundation.milestone(userId, brick, "journey:chapter1:" + userId, "Xong chương Làm quen") > 0) {
                    r.put("foundation", brick);
                    r.put("foundationLabel", foundation.label(brick));
                }
            }
            case 2 -> r.put("points", points(userId, settings.getInt("chapter2_points"), "Hành trình: xong chương Tìm lớp"));
            case 3 -> r.put("achievement", achievement(userId, c.no(), "Nhà hảo tâm nhỏ", "Đã học thử và đăng ký khóa học đầu tiên", "💛"));
            case 4 -> {
                if (stickers != null) r.put("sticker", stickers.dropRandom(userId, GAME, "chapter4"));
                r.put("points", points(userId, settings.getInt("chapter4_points"), "Hành trình: xong chương Đi học"));
            }
            case 5 -> r.put("achievement", achievement(userId, c.no(), "Đại sứ anyLEARN", "Đã lan tỏa anyLEARN tới bạn bè", "🌟"));
            default -> { }
        }
        if (vouchers != null) {
            int given = vouchers.fire(VOUCHER_EVENT, userId, c.no());
            if (given > 0) r.put("vouchers", given);
        }
        if (events != null) events.record(userId, GAME, "chapter", String.valueOf(c.no()), coinAmount);
        return r;
    }

    private static Map<String, Object> reward(String kind, String key, String label) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("kind", kind);
        r.put("key", key);
        r.put("label", label);
        return r;
    }

    private void credit(long userId, int amount, String detail) {
        if (amount > 0 && coins != null) coins.credit(userId, amount, CoinService.SOURCE_JOURNEY, detail);
    }

    private int points(long userId, int amount, String content) {
        if (amount <= 0 || wallet == null || transactions == null) return 0;
        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setType(TX_BONUS);
        tx.setAmount((long) amount);
        tx.setPayMethod("wallet_c");
        tx.setContent(content);
        tx.setStatus(1);
        tx.setCreatedAt(LocalDateTime.now(clock));
        tx.setUpdatedAt(LocalDateTime.now(clock));
        transactions.save(tx);
        wallet.creditWalletC(userId, amount);
        return amount;
    }

    private String achievement(long userId, int chapter, String title, String subtitle, String icon) {
        if (achievements == null) return null;
        try {
            return achievements.grant(userId, AchievementRules.JOURNEY, "journey:" + chapter, title, subtitle, icon);
        } catch (Exception e) {
            log.warn("[journey] achievement for {} failed: {}", userId, e.getMessage());
            return null;
        }
    }

    // ── events from the app ──────────────────────────────────────────────

    /** Records a mission signal the server cannot see by itself, once per account and type. Unknown types are ignored. */
    public boolean recordEvent(long userId, String type) {
        if (type == null || !EVENTS.contains(type) || events == null) return false;
        if (event(userId, type)) return false;
        events.record(userId, GAME, type, null, 0);
        return true;
    }

    // ── admin ────────────────────────────────────────────────────────────

    public Map<String, Object> report() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("claims", jdbc.queryForList("SELECT mission_key AS mkey, COUNT(*) AS people FROM journey_claims GROUP BY mission_key ORDER BY mission_key"));
        out.put("settings", settings.asMap());
        List<Map<String, Object>> defs = new ArrayList<>();
        for (JourneyRules.Def d : JourneyRules.DEFS) defs.add(Map.of("key", d.key(), "chapter", d.chapter(), "label", d.label(), "optional", d.optional()));
        out.put("defs", defs);
        out.put("chapters", JourneyRules.CHAPTERS);
        return out;
    }
}
