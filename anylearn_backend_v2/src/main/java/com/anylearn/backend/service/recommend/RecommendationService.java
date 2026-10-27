package com.anylearn.backend.service.recommend;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemScheduleRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.LearnerDob;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.collections.CollectionService;
import com.anylearn.backend.service.search.ItemVisibility;
import com.anylearn.backend.service.search.SearchFilters;
import com.anylearn.backend.service.recommend.RecommendationRules.Candidate;
import com.anylearn.backend.service.recommend.RecommendationRules.Slot;
import com.anylearn.backend.service.today.Learner;
import com.anylearn.backend.service.today.LearnerLoader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Rule based suggestions (plan 08.2). Each source gives seeds (a course and the reason to show); the common filter in
 * {@link RecommendationRules} removes courses that are owned, dismissed, wrong for the age or clash with the week; the
 * best score per course wins. Every suggestion carries the text a parent reads.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private static final int MAX_INTERESTS_USED = 3;
    private static final int SEEDS_PER_SOURCE = 30;

    /** Vietnamese search words of the interest keys (see LearnerInterestRules). */
    private static final Map<String, String> INTEREST_WORDS = Map.ofEntries(
            Map.entry("chess", "cờ vua"), Map.entry("art", "vẽ"), Map.entry("swim", "bơi"), Map.entry("english", "tiếng anh"),
            Map.entry("coding", "lập trình"), Map.entry("dance", "múa"), Map.entry("music", "âm nhạc"), Map.entry("sports", "thể thao"),
            Map.entry("life_skills", "kỹ năng sống"), Map.entry("math", "toán"), Map.entry("science", "stem"), Map.entry("reading", "đọc"));

    /** Vietnamese words of an interest key ("chess" -> "cờ vua"); null for an unknown key. */
    public static String interestWord(String key) {
        return INTEREST_WORDS.get(key);
    }

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ItemScheduleRepository itemScheduleRepository;
    private final LearnerLoader learnerLoader;
    private final PathwayService pathwayService;
    private final CollectionService collectionService;
    private final MeilisearchService meilisearchService;
    private final RecommendationSettings settings;
    private final Clock clock;

    /** A course to suggest and why; `{title}` in the text is replaced by the course title. */
    private record Seed(Long itemId, String source, String reasonCode, String text, int score) {}

    private record LearnerContext(User user, Learner info, int[] ageBounds, Set<Long> owned, Set<Long> dismissed, List<Slot> busy) {
        String name() {
            return info.self() ? "Bạn" : info.name();
        }
    }

    private record ItemData(Item item, User author, List<List<Slot>> options) {}

    // ── Entry points ─────────────────────────────────────────────────────────

    /** The one card of /today for a learner (empty when nothing fits or every source is off). */
    public List<Map<String, Object>> forToday(User account, Long learnerId) {
        LearnerContext ctx = contextOf(account, learnerId);
        List<Seed> seeds = new ArrayList<>();
        List<String> on = settings.sources();
        if (on.contains(RecommendationRules.PATHWAY)) seeds.addAll(pathwaySeeds(ctx));
        if (on.contains(RecommendationRules.SIBLING)) seeds.addAll(siblingSeeds(account, ctx, null));
        if (on.contains(RecommendationRules.FREE_SLOT)) seeds.addAll(freeSlotSeeds(ctx, account));
        if (on.contains(RecommendationRules.SEASON)) seeds.addAll(seasonSeeds());
        if (on.contains(RecommendationRules.INTEREST)) seeds.addAll(interestSeeds(ctx));
        return present(ctx, finish(ctx, seeds, 1));
    }

    /** What the AI is asked about: the learner and the courses that survived the rule filter, best rule score first. */
    public record Pool(Long learnerId, String learnerName, boolean self, int[] ageBounds, List<Candidate> candidates) {}

    /**
     * The shortlist for the AI: every enabled rule source (plus the parent's "wants" and, to fill up, the popular courses
     * of the age), filtered and ranked by the rule engine, at most `limit` courses.
     */
    public Pool pool(User account, Long learnerId, int limit) {
        LearnerContext ctx = contextOf(account, learnerId);
        List<Seed> seeds = new ArrayList<>();
        List<String> on = settings.sources();
        if (on.contains(RecommendationRules.PATHWAY)) seeds.addAll(pathwaySeeds(ctx));
        if (on.contains(RecommendationRules.SIBLING)) seeds.addAll(siblingSeeds(account, ctx, null));
        if (on.contains(RecommendationRules.FREE_SLOT)) seeds.addAll(freeSlotSeeds(ctx, account));
        if (on.contains(RecommendationRules.SEASON)) seeds.addAll(seasonSeeds());
        if (on.contains(RecommendationRules.INTEREST)) seeds.addAll(interestSeeds(ctx));
        seeds.addAll(wantSeeds(ctx));
        seeds.addAll(popularSeeds(ctx));
        return new Pool(learnerId, ctx.name(), ctx.info().self(), ctx.ageBounds(), finish(ctx, seeds, limit));
    }

    /** Cards for these course ids in this order, leaving out courses the learner owns or that are no longer visible. */
    public List<Map<String, Object>> cardsFor(User account, Long learnerId, List<Long> itemIds, Map<Long, String> reasons) {
        if (itemIds.isEmpty()) return List.of();
        LearnerContext ctx = contextOf(account, learnerId);
        Map<Long, ItemData> items = loadItems(new HashSet<>(itemIds));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Long id : itemIds) {
            ItemData data = items.get(id);
            if (data == null || ctx.owned().contains(id) || ctx.dismissed().contains(id)) continue;
            Item item = data.item();
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("itemId", item.getId());
            map.put("title", item.getTitle());
            map.put("image", item.getImage());
            map.put("price", item.getPrice());
            map.put("seoUrl", item.getSeoUrl());
            map.put("learnerId", learnerId);
            map.put("learnerName", ctx.name());
            map.put("source", RecommendationRules.AI);
            map.put("reasonCode", "ai");
            map.put("reasonText", reasons.getOrDefault(id, ""));
            out.add(map);
        }
        return out;
    }

    /** After an order: suggestions for the other children of the account, from the classes this order bought. */
    public List<Map<String, Object>> forOrder(User account, Long orderId) {
        if (!settings.sources().contains(RecommendationRules.SIBLING)) return List.of();
        Integer mine = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE id = ? AND user_id = ?", Integer.class, orderId, account.getId());
        if (mine == null || mine == 0) return List.of();
        Map<Long, Set<Long>> boughtBy = new HashMap<>();
        jdbc.queryForList("SELECT user_id, item_id FROM order_details WHERE order_id = ?", orderId).forEach(row ->
                boughtBy.computeIfAbsent(((Number) row.get("user_id")).longValue(), k -> new HashSet<>()).add(((Number) row.get("item_id")).longValue()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Learner target : learnerLoader.learnersOf(account)) {
            if (boughtBy.containsKey(target.id())) continue; // already in this order
            LearnerContext ctx = contextOf(account, target.id());
            result.addAll(present(ctx, finish(ctx, siblingSeeds(account, ctx, boughtBy), 1)));
        }
        return result.stream().limit(3).toList();
    }

    /** The next course of a pathway after `itemId` for a learner, as a sentence for a notification ("" when none). */
    public String nextStepText(Long learnerId, Long itemId) {
        try {
            Set<Long> owned = ownedItems(learnerId);
            for (PathwayService.Chain chain : pathwayService.chainsOf(itemId)) {
                Optional<Long> next = RecommendationRules.nextStep(chain.itemIds(), itemId, owned);
                if (next.isPresent()) {
                    Optional<Item> item = itemRepository.findById(next.get());
                    if (item.isPresent() && ItemVisibility.isItemOn(item.get().getStatus(), item.get().getUserStatus())) {
                        return " Bước tiếp theo của lộ trình " + chain.title() + ": " + item.get().getTitle() + ".";
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Recommendation: next step failed for learner {}: {}", learnerId, e.getMessage());
        }
        return "";
    }

    // ── Seeds ────────────────────────────────────────────────────────────────

    private List<Seed> pathwaySeeds(LearnerContext ctx) {
        List<Seed> seeds = new ArrayList<>();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.item_id, e.status, i.title FROM user_course_enrollments e JOIN items i ON i.id = e.item_id WHERE e.user_id = ?", ctx.info().id());
        for (Map<String, Object> row : rows) {
            Long itemId = ((Number) row.get("item_id")).longValue();
            boolean running = "active".equals(row.get("status"));
            for (PathwayService.Chain chain : pathwayService.chainsOf(itemId)) {
                RecommendationRules.nextStep(chain.itemIds(), itemId, ctx.owned()).ifPresent(next -> seeds.add(new Seed(next,
                        RecommendationRules.PATHWAY, "pathway_next",
                        "%s %s %s, bước tiếp theo của lộ trình %s là {title}".formatted(
                                ctx.name(), running ? "đang học" : "đã học", row.get("title"), chain.title()),
                        RecommendationRules.baseScore(RecommendationRules.PATHWAY) + (running ? 0 : 5))));
            }
        }
        return seeds;
    }

    /** Courses of the partner a sibling studies with. `scope` (learner id -> course ids) limits which classes count (an order). */
    private List<Seed> siblingSeeds(User account, LearnerContext target, Map<Long, Set<Long>> scope) {
        if (target.ageBounds() == null) return List.of();
        List<Seed> seeds = new ArrayList<>();
        for (Learner sibling : learnerLoader.learnersOf(account)) {
            if (sibling.id().equals(target.info().id())) continue;
            Set<Long> only = scope == null ? null : scope.get(sibling.id());
            if (scope != null && (only == null || only.isEmpty())) continue;
            String siblingName = sibling.self() ? "Bạn" : sibling.name();
            for (Map<String, Object> row : jdbc.queryForList("""
                    SELECT i.id, i.title, i.user_id, a.name AS partner FROM user_course_enrollments e
                    JOIN items i ON i.id = e.item_id JOIN users a ON a.id = i.user_id
                    WHERE e.user_id = ? AND e.status IN ('active','pending')""", sibling.id())) {
                Long siblingItem = ((Number) row.get("id")).longValue();
                if (only != null && !only.contains(siblingItem)) continue;
                Integer age = target.ageBounds()[0] == target.ageBounds()[1] ? target.ageBounds()[0] : null;
                String text = "%s đang học %s ở %s, %s%s cũng có lớp {title}".formatted(
                        siblingName, row.get("title"), row.get("partner"), target.name(), RecommendationRules.ageText(age));
                jdbc.queryForList("SELECT id FROM items WHERE user_id = ? AND status = 1 AND user_status = 1 AND id <> ? ORDER BY id DESC LIMIT ?",
                        row.get("user_id"), siblingItem, SEEDS_PER_SOURCE).forEach(other -> seeds.add(new Seed(
                        ((Number) other.get("id")).longValue(), RecommendationRules.SIBLING, "sibling_same_partner", text,
                        RecommendationRules.baseScore(RecommendationRules.SIBLING))));
            }
        }
        return seeds;
    }

    private List<Seed> freeSlotSeeds(LearnerContext ctx, User account) {
        if (ctx.busy().isEmpty()) return List.of();
        List<String> provinces = jdbc.queryForList("""
                SELECT DISTINCT l.province_code FROM user_course_enrollments e JOIN items i ON i.id = e.item_id
                LEFT JOIN item_schedules s ON s.id = e.schedule_id
                JOIN user_locations l ON l.id = COALESCE(s.user_location_id, i.user_location_id)
                WHERE e.user_id = ? AND l.province_code IS NOT NULL""", String.class, ctx.info().id());
        List<Seed> seeds = new ArrayList<>();
        for (DayOfWeek day : RecommendationRules.freeDays(ctx.busy())) {
            String sql = """
                    SELECT DISTINCT s.item_id FROM item_schedules s JOIN items i ON i.id = s.item_id
                    WHERE s.status = 1 AND i.status = 1 AND i.user_status = 1 AND COALESCE(i.is_paymentfee, 0) = 0
                      AND FIND_IN_SET(?, s.weekdays) > 0""";
            List<Object> args = new ArrayList<>(List.of(dayKey(day)));
            if (!provinces.isEmpty()) {
                sql += " AND (i.subtype IN ('online','digital','video') OR EXISTS (SELECT 1 FROM user_locations l2"
                        + " WHERE l2.id = COALESCE(s.user_location_id, i.user_location_id) AND l2.province_code IN ("
                        + provinces.stream().map(p -> "?").collect(Collectors.joining(",")) + ")))";
                args.addAll(provinces);
            }
            sql += " ORDER BY s.item_id DESC LIMIT " + SEEDS_PER_SOURCE;
            String text = "%s %s đang rảnh, có lớp {title}".formatted(RecommendationRules.dayLabel(day), ctx.name());
            jdbc.queryForList(sql, Long.class, args.toArray()).forEach(id -> seeds.add(new Seed(id, RecommendationRules.FREE_SLOT,
                    "free_slot_" + dayKey(day), text, RecommendationRules.baseScore(RecommendationRules.FREE_SLOT))));
        }
        return seeds;
    }

    private List<Seed> seasonSeeds() {
        List<Seed> seeds = new ArrayList<>();
        for (Map<String, Object> collection : collectionService.listPublic(LocalDate.now(clock))) {
            Long id = ((Number) collection.get("id")).longValue();
            String text = "Đang vào mùa: " + collection.get("title") + ", gợi ý {title}";
            jdbc.queryForList("SELECT item_id FROM collection_items WHERE collection_id = ? ORDER BY sort_order LIMIT ?", Long.class, id, SEEDS_PER_SOURCE)
                    .forEach(itemId -> seeds.add(new Seed(itemId, RecommendationRules.SEASON, "season_collection", text,
                            RecommendationRules.baseScore(RecommendationRules.SEASON))));
        }
        return seeds;
    }

    private List<Seed> interestSeeds(LearnerContext ctx) {
        if (ctx.ageBounds() == null) return List.of();
        List<String> likes = jdbc.queryForList("SELECT tag FROM learner_interests WHERE learner_id = ? AND source = 'likes' ORDER BY id LIMIT ?",
                String.class, ctx.info().id(), MAX_INTERESTS_USED);
        List<Seed> seeds = new ArrayList<>();
        for (String like : likes) {
            String word = INTEREST_WORDS.get(like);
            if (word == null) continue;
            var filters = SearchFilters.Builder.empty().learnerAge(ctx.ageBounds()[0], ctx.ageBounds()[1]).today(LocalDate.now(clock)).build();
            for (Long id : meilisearchService.searchIds(word, 6, filters, null, null)) {
                seeds.add(new Seed(id, RecommendationRules.INTEREST, "interest_" + like,
                        ctx.name() + " thích " + word + ", gợi ý {title}", RecommendationRules.baseScore(RecommendationRules.INTEREST)));
            }
        }
        return seeds;
    }

    /** What the parent wants the child to learn (survey answers "wants"). */
    private List<Seed> wantSeeds(LearnerContext ctx) {
        if (ctx.ageBounds() == null) return List.of();
        List<String> wants = jdbc.queryForList("SELECT tag FROM learner_interests WHERE learner_id = ? AND source = 'wants' ORDER BY id LIMIT ?",
                String.class, ctx.info().id(), MAX_INTERESTS_USED);
        List<Seed> seeds = new ArrayList<>();
        for (String want : wants) {
            String word = INTEREST_WORDS.get(want);
            if (word == null) continue;
            var filters = SearchFilters.Builder.empty().learnerAge(ctx.ageBounds()[0], ctx.ageBounds()[1]).today(LocalDate.now(clock)).build();
            for (Long id : meilisearchService.searchIds(word, 6, filters, null, null)) {
                seeds.add(new Seed(id, RecommendationRules.INTEREST, "want_" + want,
                        "Phụ huynh muốn " + ctx.name() + " học " + word + ", gợi ý {title}", RecommendationRules.baseScore(RecommendationRules.INTEREST)));
            }
        }
        return seeds;
    }

    /** Fills the shortlist with the popular courses of the age when the other sources give few. */
    private List<Seed> popularSeeds(LearnerContext ctx) {
        if (ctx.ageBounds() == null) return List.of();
        var filters = SearchFilters.Builder.empty().learnerAge(ctx.ageBounds()[0], ctx.ageBounds()[1]).today(LocalDate.now(clock)).build();
        List<Seed> seeds = new ArrayList<>();
        for (Long id : meilisearchService.searchIds("", SEEDS_PER_SOURCE * 2, filters, null, null)) {
            seeds.add(new Seed(id, RecommendationRules.INTEREST, "popular", "Khóa học được nhiều bạn cùng tuổi chọn: {title}", 10));
        }
        return seeds;
    }

    // ── Filtering and output ─────────────────────────────────────────────────

    private List<Candidate> finish(LearnerContext ctx, List<Seed> seeds, int limit) {
        Map<Long, ItemData> items = loadItems(seeds.stream().map(Seed::itemId).collect(Collectors.toSet()));
        List<Candidate> eligible = new ArrayList<>();
        for (Seed seed : seeds) {
            ItemData data = items.get(seed.itemId());
            if (data == null) continue;
            Candidate candidate = new Candidate(seed.itemId(), seed.source(), seed.reasonCode(),
                    seed.text().replace("{title}", String.valueOf(data.item().getTitle())), seed.score(),
                    data.item().getAgesMin() == null ? null : data.item().getAgesMin().intValue(),
                    data.item().getAgesMax() == null ? null : data.item().getAgesMax().intValue(), data.options());
            RecommendationRules.eligible(candidate, ctx.ageBounds(), ctx.owned(), ctx.dismissed(), ctx.busy()).ifPresent(eligible::add);
        }
        return RecommendationRules.rank(eligible, limit);
    }

    private List<Map<String, Object>> present(LearnerContext ctx, List<Candidate> ranked) {
        if (ranked.isEmpty()) return List.of();
        Map<Long, Item> items = itemRepository.findAllById(ranked.stream().map(Candidate::itemId).toList()).stream()
                .collect(Collectors.toMap(Item::getId, i -> i));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Candidate candidate : ranked) {
            Item item = items.get(candidate.itemId());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("itemId", item.getId());
            map.put("title", item.getTitle());
            map.put("image", item.getImage());
            map.put("price", item.getPrice());
            map.put("seoUrl", item.getSeoUrl());
            map.put("learnerId", ctx.info().id());
            map.put("learnerName", ctx.name());
            map.put("source", candidate.source());
            map.put("reasonCode", candidate.reasonCode());
            map.put("reasonText", candidate.reasonText());
            out.add(map);
        }
        return out;
    }

    /** Courses a visitor could open (switched on, live partner) with the weekly slots of each of their classes. */
    private Map<Long, ItemData> loadItems(Set<Long> ids) {
        Map<Long, ItemData> result = new HashMap<>();
        if (ids.isEmpty()) return result;
        Map<Long, User> authors = new HashMap<>();
        for (Item item : itemRepository.findAllById(ids)) {
            User author = authors.computeIfAbsent(item.getUserId(), id -> userRepository.findById(id).orElse(null));
            if (author == null || !ItemVisibility.isVisible(item.getStatus(), item.getUserStatus(), author.getStatus(), author.getIsSigned())) continue;
            List<List<Slot>> options = new ArrayList<>();
            for (ItemSchedule schedule : itemScheduleRepository.findByItemIdAndStatus(item.getId(), (byte) 1)) {
                options.add(RecommendationRules.slotsOf(schedule.getWeekdays(), schedule.getTimeStart(), schedule.getTimeEnd()));
            }
            result.put(item.getId(), new ItemData(item, author, options));
        }
        return result;
    }

    private LearnerContext contextOf(User account, Long learnerId) {
        Learner info = learnerLoader.require(account, learnerId);
        User user = userRepository.findById(learnerId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người học"));
        int[] bounds = user.getDob() == null ? null
                : LearnerDob.ageBounds(user.getDob(), Boolean.TRUE.equals(user.getDobYearOnly()), LocalDate.now(clock));
        Set<Long> dismissed = new HashSet<>(jdbc.queryForList(
                "SELECT item_id FROM recommendation_dismissals WHERE learner_id = ? AND dismissed_until > ?", Long.class, learnerId, LocalDateTime.now(clock)));
        List<Slot> busy = new ArrayList<>();
        jdbc.queryForList("""
                SELECT s.weekdays, s.time_start, s.time_end FROM user_course_enrollments e JOIN item_schedules s ON s.id = e.schedule_id
                WHERE e.user_id = ? AND e.status IN ('active','pending') AND (e.end_date IS NULL OR e.end_date >= ?)""",
                learnerId, LocalDate.now(clock)).forEach(row -> busy.addAll(RecommendationRules.slotsOf(
                (String) row.get("weekdays"), (String) row.get("time_start"), (String) row.get("time_end"))));
        return new LearnerContext(user, info, bounds, ownedItems(learnerId), dismissed, busy);
    }

    private Set<Long> ownedItems(Long learnerId) {
        return new HashSet<>(jdbc.queryForList("""
                SELECT item_id FROM user_course_enrollments WHERE user_id = ?
                UNION SELECT item_id FROM order_details WHERE user_id = ? AND status NOT LIKE 'cancel%'""", Long.class, learnerId, learnerId));
    }

    private static String dayKey(DayOfWeek day) {
        return day.name().substring(0, 3).toLowerCase();
    }

    // ── Events and dismissals ────────────────────────────────────────────────

    /** Records that a suggestion was shown or clicked. A view is kept once a day per learner, course and place. */
    public void record(User account, Long learnerId, Long itemId, String source, String context, String event) {
        learnerLoader.require(account, learnerId);
        if (!RecommendationRules.validEventSource(source) || !RecommendationRules.validEvent(event) || itemId == null) {
            throw new IllegalArgumentException("Dữ liệu gợi ý không hợp lệ");
        }
        String where = context == null || context.isBlank() ? "today" : context.trim();
        if ("view".equals(event)) {
            jdbc.update("""
                    INSERT INTO recommendation_events (user_id, learner_id, item_id, source, context, event)
                    SELECT ?, ?, ?, ?, ?, 'view' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recommendation_events
                      WHERE learner_id = ? AND item_id = ? AND context = ? AND event = 'view' AND created_at >= CURDATE())""",
                    account.getId(), learnerId, itemId, source, where, learnerId, itemId, where);
        } else {
            jdbc.update("INSERT INTO recommendation_events (user_id, learner_id, item_id, source, context, event) VALUES (?, ?, ?, ?, ?, 'click')",
                    account.getId(), learnerId, itemId, source, where);
        }
    }

    /** "Không quan tâm": the suggestion is hidden for this learner for `recommend/dismiss_days` days. */
    public Map<String, Object> dismiss(User account, Long learnerId, Long itemId) {
        learnerLoader.require(account, learnerId);
        if (itemId == null) throw new IllegalArgumentException("Thiếu khóa học");
        LocalDateTime until = RecommendationRules.dismissedUntil(LocalDateTime.now(clock), settings.dismissDays());
        jdbc.update("""
                INSERT INTO recommendation_dismissals (learner_id, item_id, user_id, dismissed_until) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE dismissed_until = VALUES(dismissed_until), user_id = VALUES(user_id)""",
                learnerId, itemId, account.getId(), until);
        return Map.of("hiddenUntil", until.toString());
    }

    // ── Report for the back office ───────────────────────────────────────────

    /** Per kind of suggestion in a period: views, clicks, and clicks followed by an order of that course for that learner. */
    public List<Map<String, Object>> stats(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        Map<String, Map<String, Object>> bySource = new LinkedHashMap<>();
        for (String source : RecommendationRules.SOURCES) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("source", source);
            row.put("enabled", settings.sources().contains(source));
            row.put("views", 0L);
            row.put("clicks", 0L);
            row.put("orders", 0L);
            bySource.put(source, row);
        }
        jdbc.queryForList("SELECT source, event, COUNT(*) AS n FROM recommendation_events WHERE created_at >= ? AND created_at < ? GROUP BY source, event",
                start, end).forEach(row -> {
            Map<String, Object> target = bySource.get(String.valueOf(row.get("source")));
            if (target != null) target.put("view".equals(row.get("event")) ? "views" : "clicks", ((Number) row.get("n")).longValue());
        });
        jdbc.queryForList("""
                SELECT e.source, COUNT(DISTINCT e.learner_id, e.item_id) AS n FROM recommendation_events e
                JOIN order_details od ON od.item_id = e.item_id AND od.user_id = e.learner_id AND od.created_at >= e.created_at
                  AND od.created_at < DATE_ADD(e.created_at, INTERVAL 30 DAY) AND od.status NOT LIKE 'cancel%'
                WHERE e.event = 'click' AND e.created_at >= ? AND e.created_at < ? GROUP BY e.source""", start, end).forEach(row -> {
            Map<String, Object> target = bySource.get(String.valueOf(row.get("source")));
            if (target != null) target.put("orders", ((Number) row.get("n")).longValue());
        });
        bySource.values().forEach(row -> {
            long views = (Long) row.get("views");
            long clicks = (Long) row.get("clicks");
            row.put("clickRate", views == 0 ? 0 : Math.round(clicks * 1000.0 / views) / 10.0);
        });
        return new ArrayList<>(bySource.values());
    }
}
