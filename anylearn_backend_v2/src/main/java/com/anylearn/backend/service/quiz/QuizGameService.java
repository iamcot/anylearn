package com.anylearn.backend.service.quiz;

import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.sticker.StickerService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * The rank quiz game (plan 14, phase 4). Everything is decided here: the question is chosen, shuffled, timed and graded
 * on the server, and the right answer never leaves it before grading. Prices and rewards use the game currency
 * ({@link CoinService}), never anyPoint.
 */
@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class QuizGameService {

    /** Network lag allowed on top of the clock, in seconds. */
    static final int GRACE_SECONDS = 2;
    private static final String SOURCE_USE = "use";
    static final String MODE_RANK = "rank";
    static final String MODE_PRACTICE = "practice";

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final QuizSettings quizSettings;
    private final QuizGameSettings settings;
    private final CoinService coins;
    private final FunSettings funSettings;
    private final StickerService stickers;
    private final GameEventService events;
    private final QuizBoardService board;
    private final AchievementService achievements;
    private final QuizPackService packs;

    private final Random random = new Random();

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    private record Profile(int rank, int stars, int guard, int streak, int best, int games, int correct, int wrong, Long activeAttempt) {}

    private record Question(long id, String topic, int difficulty, String body, String[] options, int correct, String explanation) {}

    private record Attempt(long id, long userId, long questionId, int rank, int starsBefore, int[] order, String items,
                           LocalDateTime issuedAt, LocalDateTime expiresAt, String outcome, String hidden, String community, String mode, Long packId) {
        boolean practice() { return MODE_PRACTICE.equals(mode); }
    }

    private record EnergyRow(Integer value, LocalDateTime at) {}

    // ---------------------------------------------------------------- lobby

    @Transactional
    public Map<String, Object> me(long userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> forfeited = forfeitOpen(userId);
        out.put("enabled", settings.enabled());
        out.put("coinName", funSettings.coinName());
        out.put("coins", coins.balance(userId));
        Profile p = profile(userId);
        out.put("profile", profileView(p));
        Map<String, Integer> owned = items(userId);
        out.put("items", owned);
        out.put("itemList", itemList(owned));
        out.put("boxReady", boxReady(userId));
        out.put("topics", jdbc.queryForList("SELECT topic_key AS `key`, label FROM quiz_topics WHERE active = 1 ORDER BY sort_order, topic_key"));
        out.put("seconds", settings.seconds());
        out.put("buyLeft", Math.max(settings.buyDailyCap() - boughtToday(userId), 0));
        LocalDateTime start = today().atStartOfDay();
        Map<String, Object> day = jdbc.queryForMap("SELECT COUNT(*) AS games, COALESCE(SUM(outcome = 'correct'), 0) AS correct FROM quiz_attempts WHERE user_id = ? AND issued_at >= ? AND outcome <> 'open'", userId, Timestamp.valueOf(start));
        out.put("today", Map.of("games", ((Number) day.get("games")).intValue(), "correct", ((Number) day.get("correct")).intValue()));
        out.put("hideBoard", board.isHidden(userId));
        out.put("energy", energyView(userId));
        out.put("packSize", settings.packSize());
        List<Map<String, Object>> packList = new ArrayList<>();
        for (QuizPackService.Pack pack : packs.active(userId)) packList.add(packs.view(pack));
        out.put("packs", packList);
        QuizPackService.Pack inUse = packs.inUse(userId);
        out.put("activePackId", inUse == null ? null : inUse.id());
        if (forfeited != null) out.put("forfeited", forfeited);
        return out;
    }

    private Map<String, Object> profileView(Profile p) {
        List<Integer> stars = settings.rankStars();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rank", p.rank());
        out.put("rankName", QuizRules.RANKS.get(p.rank()).label());
        out.put("rankKey", QuizRules.RANKS.get(p.rank()).key());
        out.put("stars", p.stars());
        out.put("needed", QuizProgress.needed(stars, p.rank()));
        out.put("guard", p.guard() == 1);
        out.put("streak", p.streak());
        out.put("bestRank", p.best());
        out.put("bestRankName", QuizRules.RANKS.get(p.best()).label());
        out.put("games", p.games());
        out.put("correct", p.correct());
        out.put("wrong", p.wrong());
        out.put("ranks", rankTable(stars));
        return out;
    }

    private List<Map<String, Object>> rankTable(List<Integer> stars) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < QuizRules.RANKS.size(); i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", QuizRules.RANKS.get(i).key());
            row.put("name", QuizRules.RANKS.get(i).label());
            row.put("needed", QuizProgress.needed(stars, i));
            out.add(row);
        }
        return out;
    }

    private List<Map<String, Object>> itemList(Map<String, Integer> owned) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (String item : QuizItems.ALL) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", item);
            row.put("label", QuizItems.LABELS.get(item));
            row.put("phase", QuizItems.BEFORE.contains(item) ? "before" : "during");
            row.put("qty", owned.getOrDefault(item, 0));
            row.put("cap", QuizItems.cap(item));
            row.put("price", settings.price(item));
            out.add(row);
        }
        return out;
    }

    // ---------------------------------------------------------------- energy

    private EnergyRow energyRow(long userId) {
        jdbc.update("INSERT IGNORE INTO quiz_profiles (user_id) VALUES (?)", userId);
        return jdbc.queryForObject("SELECT energy, energy_at FROM quiz_profiles WHERE user_id = ?",
                (rs, i) -> new EnergyRow((Integer) rs.getObject("energy"), rs.getTimestamp("energy_at") == null ? null : rs.getTimestamp("energy_at").toLocalDateTime()), userId);
    }

    /** The energy bar as the API shows it: `{value, max, nextInSeconds, regenMinutes, cost}`. */
    public Map<String, Object> energyView(long userId) {
        EnergyRow row = energyRow(userId);
        int max = settings.energyMax();
        int regen = settings.energyRegenMinutes();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("value", QuizEnergy.current(row.value(), row.at(), now(), max, regen));
        out.put("max", max);
        out.put("nextInSeconds", QuizEnergy.nextInSeconds(row.value(), row.at(), now(), max, regen));
        out.put("regenMinutes", regen);
        out.put("cost", settings.energyCost());
        return out;
    }

    /** Spends the energy of a ranked question or throws "Hết năng lượng, hồi 1 sau mm:ss". */
    private void spendEnergy(long userId) {
        int cost = settings.energyCost();
        if (cost <= 0) return;
        EnergyRow row = energyRow(userId);
        int max = settings.energyMax();
        int regen = settings.energyRegenMinutes();
        QuizEnergy.State after = QuizEnergy.spend(row.value(), row.at(), now(), max, regen, cost);
        if (after == null) {
            throw new IllegalStateException("Hết năng lượng, hồi 1 sau " + QuizEnergy.mmss(QuizEnergy.nextInSeconds(row.value(), row.at(), now(), max, regen)));
        }
        jdbc.update("UPDATE quiz_profiles SET energy = ?, energy_at = ? WHERE user_id = ?", after.value(), Timestamp.valueOf(after.at()), userId);
    }

    /** True when the bar is full (nothing to refill). */
    public boolean energyFull(long userId) {
        EnergyRow row = energyRow(userId);
        return QuizEnergy.current(row.value(), row.at(), now(), settings.energyMax(), settings.energyRegenMinutes()) >= settings.energyMax();
    }

    /** Adds energy bought in the shop (never above the max) and returns the bar. */
    @Transactional
    public Map<String, Object> addEnergy(long userId, int amount) {
        EnergyRow row = energyRow(userId);
        QuizEnergy.State after = QuizEnergy.add(row.value(), row.at(), now(), settings.energyMax(), settings.energyRegenMinutes(), amount);
        jdbc.update("UPDATE quiz_profiles SET energy = ?, energy_at = ? WHERE user_id = ?", after.value(), Timestamp.valueOf(after.at()), userId);
        return energyView(userId);
    }

    // ---------------------------------------------------------------- profile and items

    private Profile profile(long userId) {
        jdbc.update("INSERT IGNORE INTO quiz_profiles (user_id) VALUES (?)", userId);
        return jdbc.queryForObject("SELECT rank_idx, stars, guard, streak, best_rank_idx, games, correct, wrong, active_attempt_id FROM quiz_profiles WHERE user_id = ?",
                (rs, i) -> new Profile(rs.getInt("rank_idx"), rs.getInt("stars"), rs.getInt("guard"), rs.getInt("streak"), rs.getInt("best_rank_idx"),
                        rs.getInt("games"), rs.getInt("correct"), rs.getInt("wrong"), (Long) rs.getObject("active_attempt_id")), userId);
    }

    private Map<String, Integer> items(long userId) {
        Map<String, Integer> out = new LinkedHashMap<>();
        jdbc.query("SELECT item_key, qty FROM quiz_user_items WHERE user_id = ? AND qty > 0", rs -> { out.put(rs.getString("item_key"), rs.getInt("qty")); }, userId);
        return out;
    }

    /** Adds up to `delta` copies without passing the cap; returns how many were really added. */
    private int addItem(long userId, String item, int delta, String source, String ref) {
        int have = items(userId).getOrDefault(item, 0);
        int add = Math.min(delta, QuizItems.cap(item) - have);
        if (add <= 0) return 0;
        jdbc.update("INSERT INTO quiz_user_items (user_id, item_key, qty) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)", userId, item, add);
        jdbc.update("INSERT INTO quiz_item_log (user_id, item_key, delta, source, ref) VALUES (?, ?, ?, ?, ?)", userId, item, add, source, ref);
        return add;
    }

    /** Gives `count` random items (by the drop weights, never past a cap) as a prize; returns the item keys really given. */
    public List<String> grantRandomItems(long userId, int count, String source, String ref) {
        List<String> given = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String item = QuizItems.pick(weights(), QuizItems.ALL, items(userId), random.nextDouble());
            if (item == null) break;
            if (addItem(userId, item, 1, source, ref) > 0) given.add(item);
        }
        return given;
    }

    private boolean useItem(long userId, String item, String ref) {
        int rows = jdbc.update("UPDATE quiz_user_items SET qty = qty - 1 WHERE user_id = ? AND item_key = ? AND qty >= 1", userId, item);
        if (rows != 1) return false;
        jdbc.update("INSERT INTO quiz_item_log (user_id, item_key, delta, source, ref) VALUES (?, ?, -1, ?, ?)", userId, item, SOURCE_USE, ref);
        return true;
    }

    /** Takes one copy of an item back when it is sold to Leo (plan 15); false when the person has none. */
    @Transactional
    public boolean sellItem(long userId, String item) {
        int rows = jdbc.update("UPDATE quiz_user_items SET qty = qty - 1 WHERE user_id = ? AND item_key = ? AND qty >= 1", userId, item);
        if (rows != 1) return false;
        jdbc.update("INSERT INTO quiz_item_log (user_id, item_key, delta, source, ref) VALUES (?, ?, -1, 'sell', NULL)", userId, item);
        return true;
    }

    /** What the person holds of each item. */
    public Map<String, Integer> ownedItems(long userId) {
        return items(userId);
    }

    private Map<String, Integer> weights() {
        Map<String, Integer> out = new HashMap<>();
        for (String item : QuizItems.ALL) out.put(item, settings.weight(item));
        return out;
    }

    // ---------------------------------------------------------------- daily box

    private boolean boxReady(long userId) {
        List<LocalDate> rows = jdbc.query("SELECT starter_day FROM quiz_drop_state WHERE user_id = ?", (rs, i) -> rs.getObject("starter_day", LocalDate.class), userId);
        return rows.isEmpty() || rows.get(0) == null || !rows.get(0).equals(today());
    }

    /** The starter box of the day: one item for before a question, one for during it, plus a helper when the stock is low. */
    @Transactional
    public Map<String, Object> openBox(long userId) {
        requireEnabled();
        if (!boxReady(userId)) throw new IllegalStateException("Hộp hôm nay đã mở rồi, mai quay lại nhé");
        jdbc.update("INSERT INTO quiz_drop_state (user_id, starter_day) VALUES (?, ?) ON DUPLICATE KEY UPDATE starter_day = VALUES(starter_day)", userId, today());
        Map<String, Integer> owned = items(userId);
        int stock = owned.values().stream().mapToInt(Integer::intValue).sum();
        List<String> given = new ArrayList<>();
        Map<String, Integer> weights = weights();
        for (List<String> group : List.of(QuizItems.BEFORE, QuizItems.DURING)) {
            String item = QuizItems.pick(weights, group, owned, random.nextDouble());
            if (item != null && addItem(userId, item, 1, "box", null) > 0) {
                given.add(item);
                owned.merge(item, 1, Integer::sum);
            }
        }
        if (stock < 2) {
            String help = QuizItems.pick(weights, List.of(QuizItems.FIFTY, QuizItems.TIME), owned, random.nextDouble());
            if (help != null && addItem(userId, help, 1, "box", "help") > 0) given.add(help);
        }
        events.record(userId, GameEventService.GAME_QUIZ, "box", String.join(",", given), 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("given", given);
        out.put("items", items(userId));
        return out;
    }

    // ---------------------------------------------------------------- buying

    private int boughtToday(long userId) {
        Integer sum = jdbc.queryForObject("SELECT COALESCE(SUM(delta), 0) FROM quiz_item_log WHERE user_id = ? AND source = 'buy' AND created_at >= ?",
                Integer.class, userId, Timestamp.valueOf(today().atStartOfDay()));
        return sum == null ? 0 : sum;
    }

    /** Items the person can still buy today under the daily cap. */
    public int itemBuyLeft(long userId) {
        return Math.max(settings.buyDailyCap() - boughtToday(userId), 0);
    }

    /** Buys one item with Leo Xu. */
    @Transactional
    public Map<String, Object> buy(long userId, String item) {
        requireEnabled();
        if (!QuizItems.known(item)) throw new IllegalArgumentException("Vật phẩm không tồn tại");
        int price = settings.price(item);
        if (items(userId).getOrDefault(item, 0) >= QuizItems.cap(item)) throw new IllegalStateException("Kho " + QuizItems.LABELS.get(item) + " đã đầy");
        if (boughtToday(userId) >= settings.buyDailyCap()) throw new IllegalStateException("Hôm nay bạn đã mua đủ " + settings.buyDailyCap() + " món rồi");
        if (!coins.debit(userId, price, CoinService.SOURCE_QUIZ_ITEM, "Mua " + QuizItems.LABELS.get(item))) {
            throw new IllegalStateException("Bạn chưa đủ " + funSettings.coinName() + " để mua " + QuizItems.LABELS.get(item));
        }
        addItem(userId, item, 1, "buy", null);
        events.record(userId, GameEventService.GAME_QUIZ, "buy", item, -price);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", items(userId));
        out.put("coins", coins.balance(userId));
        out.put("buyLeft", Math.max(settings.buyDailyCap() - boughtToday(userId), 0));
        return out;
    }

    // ---------------------------------------------------------------- start

    /** Hands out the next question; `mult` is mult2 / mult3 / null, `topic` a topic key or null. */
    @Transactional
    public Map<String, Object> start(long userId, String mult, boolean shield, String topic) {
        requireEnabled();
        forfeitOpen(userId);
        Profile p = profile(userId);
        QuizPackService.Pack pack = packs.inUse(userId);
        if (pack != null) return startPractice(userId, p, pack);
        if (mult != null && !QuizItems.MULT2.equals(mult) && !QuizItems.MULT3.equals(mult)) throw new IllegalArgumentException("Sao may mắn không hợp lệ");
        String topicKey = topic == null || topic.isBlank() ? null : topic;
        if (topicKey != null) {
            Integer found = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_topics WHERE topic_key = ? AND active = 1", Integer.class, topicKey);
            if (found == null || found == 0) throw new IllegalArgumentException("Chủ đề không tồn tại");
            Integer usable = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_questions WHERE status = 'active' AND topic = ?", Integer.class, topicKey);
            if (usable == null || usable == 0) throw new IllegalStateException("Chủ đề này chưa có câu hỏi, bạn chọn chủ đề khác nhé");
        }
        Map<String, Integer> owned = items(userId);
        List<String> wanted = new ArrayList<>();
        if (mult != null) wanted.add(mult);
        if (shield) wanted.add(QuizItems.SHIELD);
        if (topicKey != null) wanted.add(QuizItems.TOPIC);
        for (String item : wanted) {
            if (owned.getOrDefault(item, 0) < 1) throw new IllegalStateException("Bạn chưa có " + QuizItems.LABELS.get(item));
        }

        int difficulty = QuizRules.pickDifficulty(quizSettings.rankMix().get(QuizRules.RANKS.get(p.rank()).key()), random.nextDouble());
        Question question = chooseQuestion(userId, difficulty, topicKey, null);
        if (question == null) throw new IllegalStateException("Kho câu hỏi đang trống, bạn quay lại sau nhé");

        spendEnergy(userId);
        for (String item : wanted) useItem(userId, item, "start");
        int[] order = shuffled();
        LocalDateTime issued = now();
        LocalDateTime expires = issued.plusSeconds(settings.seconds());
        org.springframework.jdbc.support.GeneratedKeyHolder keys = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement("INSERT INTO quiz_attempts (user_id, question_id, rank_idx, stars_before, option_order, items_used, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setLong(2, question.id());
            ps.setInt(3, p.rank());
            ps.setInt(4, p.stars());
            ps.setString(5, join(order));
            ps.setString(6, String.join(",", wanted));
            ps.setTimestamp(7, Timestamp.valueOf(issued));
            ps.setTimestamp(8, Timestamp.valueOf(expires));
            return ps;
        }, keys);
        long attemptId = Objects.requireNonNull(keys.getKey()).longValue();
        jdbc.update("UPDATE quiz_profiles SET active_attempt_id = ? WHERE user_id = ?", attemptId, userId);
        jdbc.update("UPDATE quiz_questions SET times_served = times_served + 1 WHERE id = ?", question.id());
        Map<String, Object> view = attemptView(loadAttempt(attemptId), question, items(userId));
        view.put("energy", energyView(userId));
        return view;
    }

    /** A question of the active training pack: uses one question of the pack, no energy, no items, nothing for the rank. */
    private Map<String, Object> startPractice(long userId, Profile p, QuizPackService.Pack pack) {
        Question question = choosePackQuestion(userId, pack);
        if (question == null) throw new IllegalStateException("Gói này chưa có câu hỏi phù hợp, bạn chọn chủ đề khác nhé");
        int[] order = shuffled();
        LocalDateTime issued = now();
        LocalDateTime expires = issued.plusSeconds(settings.seconds());
        org.springframework.jdbc.support.GeneratedKeyHolder keys = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement("INSERT INTO quiz_attempts (user_id, question_id, rank_idx, stars_before, option_order, items_used, issued_at, expires_at, mode, pack_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'practice', ?)",
                    java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setLong(2, question.id());
            ps.setInt(3, p.rank());
            ps.setInt(4, p.stars());
            ps.setString(5, join(order));
            ps.setString(6, "");
            ps.setTimestamp(7, Timestamp.valueOf(issued));
            ps.setTimestamp(8, Timestamp.valueOf(expires));
            ps.setLong(9, pack.id());
            return ps;
        }, keys);
        long attemptId = Objects.requireNonNull(keys.getKey()).longValue();
        jdbc.update("UPDATE quiz_profiles SET active_attempt_id = ? WHERE user_id = ?", attemptId, userId);
        jdbc.update("UPDATE quiz_questions SET times_served = times_served + 1 WHERE id = ?", question.id());
        packs.consume(pack);
        Map<String, Object> view = attemptView(loadAttempt(attemptId), question, items(userId));
        view.put("energy", energyView(userId));
        return view;
    }

    /**
     * Draws for a pack with the same no-repeat fallbacks as the ranked game, from the level of the pack
     * outward (a topic pack over every level starts from a random level). The topics of the pack are never dropped.
     */
    private Question choosePackQuestion(long userId, QuizPackService.Pack pack) {
        Timestamp since = Timestamp.valueOf(now().minusDays(settings.noRepeatDays()));
        int start = pack.difficulty() != null ? pack.difficulty() : QuizRules.DIFFICULTIES.get(random.nextInt(QuizRules.DIFFICULTIES.size()));
        List<Integer> order = levelOrder(start);
        List<String> topics = pack.topic() != null ? List.of(pack.topic()) : pack.topics();
        if (pack.difficulty() != null) {
            // the level was paid for: an unseen question of that level, then a repeat of it, and only then a nearby level
            for (int level : order) {
                for (boolean unseenOnly : new boolean[]{true, false}) {
                    Question q = pick(userId, level, topics, since, null, unseenOnly);
                    if (q != null) return q;
                }
            }
            return null;
        }
        for (boolean unseenOnly : new boolean[]{true, false}) {
            for (int level : order) {
                Question q = pick(userId, level, topics, since, null, unseenOnly);
                if (q != null) return q;
            }
        }
        return null;
    }

    private static List<Integer> levelOrder(int difficulty) {
        List<Integer> order = new ArrayList<>();
        order.add(difficulty);
        for (int step = 1; step < 5; step++) {
            if (difficulty - step >= 1) order.add(difficulty - step);
            if (difficulty + step <= 5) order.add(difficulty + step);
        }
        return order;
    }

    private Question chooseQuestion(long userId, int difficulty, String topic, Long exclude) {
        Timestamp since = Timestamp.valueOf(now().minusDays(settings.noRepeatDays()));
        List<Integer> order = levelOrder(difficulty);
        // a topic of the person's own choice first (a fresh question at any level, then a repeat of that topic),
        // then any topic the same way: the topic is never dropped just because the drawn level has none
        List<String> topics = new ArrayList<>();
        if (topic != null) topics.add(topic);
        topics.add(null);
        for (String t : topics) {
            for (boolean unseenOnly : new boolean[]{true, false}) {
                for (int level : order) {
                    Question q = pick(userId, level, t == null ? null : List.of(t), since, exclude, unseenOnly);
                    if (q != null) return q;
                }
            }
        }
        return null;
    }

    private Question pick(long userId, int level, List<String> topics, Timestamp since, Long exclude, boolean unseenOnly) {
        StringBuilder sql = new StringBuilder("SELECT id, topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation FROM quiz_questions WHERE status = 'active' AND difficulty = ?");
        List<Object> args = new ArrayList<>();
        args.add(level);
        if (topics != null && !topics.isEmpty()) {
            sql.append(" AND topic IN (").append(String.join(",", Collections.nCopies(topics.size(), "?"))).append(")");
            args.addAll(topics);
        }
        if (exclude != null) { sql.append(" AND id <> ?"); args.add(exclude); }
        if (unseenOnly) {
            sql.append(" AND id NOT IN (SELECT question_id FROM quiz_attempts WHERE user_id = ? AND issued_at > ?)");
            args.add(userId);
            args.add(since);
        }
        sql.append(" ORDER BY RAND() LIMIT 1");
        List<Question> rows = jdbc.query(sql.toString(), (rs, i) -> toQuestion(rs), args.toArray());
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static Question toQuestion(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Question(rs.getLong("id"), rs.getString("topic"), rs.getInt("difficulty"), rs.getString("body"),
                new String[]{rs.getString("opt_a"), rs.getString("opt_b"), rs.getString("opt_c"), rs.getString("opt_d")},
                rs.getInt("correct"), rs.getString("explanation"));
    }

    private Question loadQuestion(long id) {
        return jdbc.queryForObject("SELECT id, topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation FROM quiz_questions WHERE id = ?", (rs, i) -> toQuestion(rs), id);
    }

    private int[] shuffled() {
        List<Integer> list = new ArrayList<>(List.of(0, 1, 2, 3));
        Collections.shuffle(list, random);
        return list.stream().mapToInt(Integer::intValue).toArray();
    }

    private static String join(int[] values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) sb.append(i == 0 ? "" : ",").append(values[i]);
        return sb.toString();
    }

    private static int[] parseInts(String text) {
        if (text == null || text.isBlank()) return new int[0];
        String[] parts = text.split(",");
        int[] out = new int[parts.length];
        for (int i = 0; i < parts.length; i++) out[i] = Integer.parseInt(parts[i].trim());
        return out;
    }

    private Attempt loadAttempt(long id) {
        List<Attempt> rows = jdbc.query("SELECT id, user_id, question_id, rank_idx, stars_before, option_order, items_used, issued_at, expires_at, outcome, hidden, community, mode, pack_id FROM quiz_attempts WHERE id = ?",
                (rs, i) -> new Attempt(rs.getLong("id"), rs.getLong("user_id"), rs.getLong("question_id"), rs.getInt("rank_idx"), rs.getInt("stars_before"),
                        parseInts(rs.getString("option_order")), rs.getString("items_used") == null ? "" : rs.getString("items_used"),
                        rs.getTimestamp("issued_at").toLocalDateTime(), rs.getTimestamp("expires_at").toLocalDateTime(), rs.getString("outcome"),
                        rs.getString("hidden"), rs.getString("community"), rs.getString("mode"), (Long) rs.getObject("pack_id")), id);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy câu hỏi này");
        return rows.get(0);
    }

    private Map<String, Object> attemptView(Attempt a, Question q, Map<String, Integer> owned) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attemptId", a.id());
        out.put("topic", q.topic());
        out.put("topicLabel", jdbc.query("SELECT label FROM quiz_topics WHERE topic_key = ?", (rs, i) -> rs.getString("label"), q.topic()).stream().findFirst().orElse(q.topic()));
        out.put("body", q.body());
        List<String> options = new ArrayList<>();
        for (int original : a.order()) options.add(q.options()[original]);
        out.put("options", options);
        out.put("hidden", a.hidden() == null ? List.of() : Arrays.stream(parseInts(a.hidden())).boxed().toList());
        out.put("community", a.community() == null ? null : Arrays.stream(parseInts(a.community())).boxed().toList());
        out.put("expiresAt", a.expiresAt().atZone(clock.getZone()).toInstant().toEpochMilli());
        out.put("serverNow", clock.millis());
        out.put("used", a.items().isBlank() ? List.of() : Arrays.asList(a.items().split(",")));
        out.put("items", owned);
        out.put("mode", a.practice() ? MODE_PRACTICE : MODE_RANK);
        if (a.practice() && a.packId() != null) out.put("pack", packs.view(packs.find(a.userId(), a.packId())));
        return out;
    }

    // ---------------------------------------------------------------- lifelines

    @Transactional
    public Map<String, Object> lifeline(long userId, long attemptId, String item) {
        requireEnabled();
        if (!QuizItems.DURING.contains(item)) throw new IllegalArgumentException("Vật phẩm này không dùng trong câu hỏi");
        Attempt a = openAttempt(userId, attemptId);
        if (a.practice()) throw new IllegalStateException("Khi tập luyện không dùng được vật phẩm");
        if (now().isAfter(a.expiresAt())) throw new IllegalStateException("Hết giờ rồi");
        List<String> used = a.items().isBlank() ? new ArrayList<>() : new ArrayList<>(Arrays.asList(a.items().split(",")));
        if (used.contains(item)) throw new IllegalStateException("Bạn đã dùng " + QuizItems.LABELS.get(item) + " ở câu này");
        Question q = loadQuestion(a.questionId());
        int correctShown = indexOf(a.order(), q.correct());

        String hidden = a.hidden();
        String community = a.community();
        long questionId = a.questionId();
        int[] order = a.order();
        LocalDateTime expires = a.expiresAt();
        Question current = q;

        switch (item) {
            case QuizItems.FIFTY -> {
                List<Integer> wrong = new ArrayList<>(List.of(0, 1, 2, 3));
                wrong.remove((Integer) correctShown);
                Collections.shuffle(wrong, random);
                hidden = join(new int[]{Math.min(wrong.get(0), wrong.get(1)), Math.max(wrong.get(0), wrong.get(1))});
            }
            case QuizItems.COMMUNITY -> community = join(votes(q, order, correctShown));
            case QuizItems.TIME -> expires = a.expiresAt().plusSeconds(settings.extraSeconds());
            case QuizItems.SWAP -> {
                Question other = chooseQuestion(userId, q.difficulty(), q.topic(), q.id());
                if (other == null || other.id() == q.id()) throw new IllegalStateException("Chưa có câu khác để đổi");
                current = other;
                questionId = other.id();
                order = shuffled();
                hidden = null;
                community = null;
                used.remove(QuizItems.FIFTY);
                used.remove(QuizItems.COMMUNITY);
                jdbc.update("UPDATE quiz_questions SET times_served = times_served + 1 WHERE id = ?", other.id());
            }
            default -> throw new IllegalArgumentException("Vật phẩm không hợp lệ");
        }
        if (!useItem(userId, item, "attempt:" + attemptId)) throw new IllegalStateException("Bạn chưa có " + QuizItems.LABELS.get(item));
        used.add(item);
        jdbc.update("UPDATE quiz_attempts SET question_id = ?, option_order = ?, hidden = ?, community = ?, items_used = ?, expires_at = ? WHERE id = ?",
                questionId, join(order), hidden, community, String.join(",", used), Timestamp.valueOf(expires), attemptId);
        return attemptView(loadAttempt(attemptId), current, items(userId));
    }

    private int[] votes(Question q, int[] order, int correctShown) {
        int[] counts = new int[4];
        jdbc.query("SELECT option_order, answer FROM quiz_attempts WHERE question_id = ? AND answer IS NOT NULL AND outcome IN ('correct', 'wrong') LIMIT 5000", rs -> {
            int[] o = parseInts(rs.getString("option_order"));
            int shown = rs.getInt("answer");
            if (shown >= 0 && shown < o.length) counts[o[shown]]++;
        }, q.id());
        int[] real = QuizItems.realVotes(counts, settings.realVotesMin());
        if (real != null) {
            int[] shown = new int[4];
            for (int i = 0; i < 4; i++) shown[i] = real[order[i]];
            return shown;
        }
        return QuizItems.simulatedVotes(correctShown, q.difficulty(), random);
    }

    private static int indexOf(int[] order, int original) {
        for (int i = 0; i < order.length; i++) if (order[i] == original) return i;
        return -1;
    }

    private Attempt openAttempt(long userId, long attemptId) {
        Attempt a = loadAttempt(attemptId);
        if (a.userId() != userId) throw new IllegalArgumentException("Không tìm thấy câu hỏi này");
        if (!"open".equals(a.outcome())) throw new IllegalStateException("Câu này đã được trả lời");
        return a;
    }

    // ---------------------------------------------------------------- answering

    /** `option` is the position shown (0..3), null for no answer; `away` says the player left the page during the question. */
    @Transactional
    public Map<String, Object> answer(long userId, long attemptId, Integer option, boolean away) {
        requireEnabled();
        Attempt a = openAttempt(userId, attemptId);
        LocalDateTime at = now();
        boolean late = at.isAfter(a.expiresAt().plusSeconds(GRACE_SECONDS));
        Question q = loadQuestion(a.questionId());
        Integer chosen = option != null && option >= 0 && option < 4 && !late ? option : null;
        boolean correct = chosen != null && a.order()[chosen] == q.correct();
        String outcome = chosen == null ? "timeout" : correct ? "correct" : "wrong";
        long elapsed = Duration.between(a.issuedAt(), at).toMillis();
        boolean flagged = away || (correct && elapsed < 1500);
        if (a.practice()) return gradePractice(a, q, chosen, outcome);
        return grade(a, q, chosen, outcome, flagged, true);
    }

    /** An unanswered question left behind (closed page, other device) counts as wrong. */
    private Map<String, Object> forfeitOpen(long userId) {
        Profile p = profile(userId);
        if (p.activeAttempt() == null) return null;
        List<Attempt> rows = jdbc.query("SELECT id FROM quiz_attempts WHERE id = ? AND outcome = 'open'", (rs, i) -> loadAttempt(rs.getLong("id")), p.activeAttempt());
        if (rows.isEmpty()) {
            jdbc.update("UPDATE quiz_profiles SET active_attempt_id = NULL WHERE user_id = ?", userId);
            return null;
        }
        Attempt a = rows.get(0);
        if (a.practice()) return gradePractice(a, loadQuestion(a.questionId()), null, "forfeit");
        return grade(a, loadQuestion(a.questionId()), null, "forfeit", false, false);
    }

    /**
     * Closes a practice question: shows the right answer and nothing else changes (no stars, rank, streak, drop, board or reward).
     * Every answered one writes a `practice` game event whose detail starts with `correct` or `wrong` (the weekly mission counts them).
     */
    private Map<String, Object> gradePractice(Attempt a, Question q, Integer chosen, String outcome) {
        long userId = a.userId();
        boolean correct = "correct".equals(outcome);
        jdbc.update("UPDATE quiz_profiles SET active_attempt_id = NULL WHERE user_id = ?", userId);
        jdbc.update("UPDATE quiz_attempts SET answer = ?, outcome = ?, answered_at = ? WHERE id = ?", chosen, outcome, Timestamp.valueOf(now()), a.id());
        if (correct) jdbc.update("UPDATE quiz_questions SET times_correct = times_correct + 1 WHERE id = ?", q.id());
        if (!"forfeit".equals(outcome)) {
            events.record(userId, GameEventService.GAME_QUIZ, "practice", (correct ? "correct" : "wrong") + " d" + q.difficulty() + " " + q.topic(), 0);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("practice", true);
        out.put("correct", correct);
        out.put("outcome", outcome);
        out.put("correctIndex", indexOf(a.order(), q.correct()));
        out.put("chosen", chosen);
        out.put("explanation", q.explanation());
        out.put("starsGained", 0);
        out.put("reward", Map.of());
        out.put("drop", null);
        if (a.packId() != null) out.put("pack", packs.view(packs.find(userId, a.packId())));
        out.put("profile", profileView(profile(userId)));
        out.put("items", items(userId));
        out.put("coins", coins.balance(userId));
        return out;
    }

    private Map<String, Object> grade(Attempt a, Question q, Integer chosen, String outcome, boolean flagged, boolean allowDrop) {
        long userId = a.userId();
        Profile p = profile(userId);
        boolean correct = "correct".equals(outcome);
        List<String> used = a.items().isBlank() ? List.of() : Arrays.asList(a.items().split(","));
        int mult = used.contains(QuizItems.MULT3) ? 3 : used.contains(QuizItems.MULT2) ? 2 : 1;
        boolean shield = used.contains(QuizItems.SHIELD);
        List<Integer> stars = settings.rankStars();
        QuizProgress.Result r = QuizProgress.apply(stars, new QuizProgress.State(p.rank(), p.stars(), p.guard()), correct, mult, shield);
        QuizProgress.State after = r.after();
        int streak = correct ? p.streak() + 1 : 0;
        int best = Math.max(p.best(), after.rank());

        jdbc.update("UPDATE quiz_profiles SET rank_idx = ?, stars = ?, guard = ?, streak = ?, best_rank_idx = ?, games = games + 1, correct = correct + ?, wrong = wrong + ?, active_attempt_id = NULL WHERE user_id = ?",
                after.rank(), after.stars(), after.guard(), streak, best, correct ? 1 : 0, correct ? 0 : 1, userId);
        jdbc.update("UPDATE quiz_attempts SET stars_after = ?, answer = ?, outcome = ?, flagged = ?, answered_at = ? WHERE id = ?",
                after.stars(), chosen, outcome, flagged ? 1 : 0, Timestamp.valueOf(now()), a.id());
        board.accumulate(userId, r.starsGained(), flagged);
        if (correct) jdbc.update("UPDATE quiz_questions SET times_correct = times_correct + 1 WHERE id = ?", q.id());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("correct", correct);
        out.put("outcome", outcome);
        out.put("correctIndex", indexOf(a.order(), q.correct()));
        out.put("chosen", chosen);
        out.put("explanation", q.explanation());
        out.put("starsGained", r.starsGained());
        out.put("rankedUp", r.rankedUp());
        out.put("rankedDown", r.rankedDown());
        out.put("guardLost", r.guardLost());
        out.put("shieldUsed", r.shieldUsed());
        out.put("multiplier", mult);
        out.put("starsBefore", p.stars());
        out.put("rankBefore", p.rank());

        Map<String, Object> reward = new LinkedHashMap<>();
        // the reward of a rank is paid once per person: only ranks above the best one reached so far pay
        if (r.rankedUp() && after.rank() > p.best()) {
            int ranksGained = after.rank() - p.best();
            int coinReward = settings.rankRewardCoins() * Math.max(ranksGained, 1);
            if (coinReward > 0) coins.credit(userId, coinReward, CoinService.SOURCE_QUIZ_RANK, "Lên hạng " + QuizRules.RANKS.get(after.rank()).label());
            int shieldAdded = addItem(userId, QuizItems.SHIELD, 1, "rankup", QuizRules.RANKS.get(after.rank()).key());
            Map<String, Object> sticker = null;
            try {
                sticker = stickers.dropRandom(userId, "quiz", "rankup:" + after.rank());
            } catch (Exception e) {
                log.warn("[quiz] rank-up sticker for user {} not given: {}", userId, e.getMessage());
            }
            reward.put("coins", coinReward);
            reward.put("shield", shieldAdded);
            if (sticker != null) reward.put("sticker", sticker);
            events.record(userId, GameEventService.GAME_QUIZ, "rankup", QuizRules.RANKS.get(after.rank()).label(), coinReward);
            String rankLabel = QuizRules.RANKS.get(after.rank()).label();
            out.put("achievement", achievements.grant(userId, AchievementRules.RANKUP, "rankup:" + QuizRules.RANKS.get(after.rank()).key(),
                    "Lên hạng " + rankLabel + " trong Leo rank", "Đã leo đến hạng " + rankLabel, QuizRules.RANKS.get(after.rank()).key()));
        }
        out.put("reward", reward);

        String drop = allowDrop ? rollDrop(userId, correct, streak) : null;
        out.put("drop", drop);
        out.put("dropLabel", drop == null ? null : QuizItems.LABELS.get(drop));

        events.record(userId, GameEventService.GAME_QUIZ, "answer", outcome + " r" + after.rank() + " s" + after.stars() + (flagged ? " flagged" : ""), 0);
        out.put("profile", profileView(profile(userId)));
        out.put("items", items(userId));
        out.put("coins", coins.balance(userId));
        return out;
    }

    /** Rolls the random item of a finished question; returns the item given or null. */
    private String rollDrop(long userId, boolean correct, int streak) {
        jdbc.update("INSERT IGNORE INTO quiz_drop_state (user_id) VALUES (?)", userId);
        Map<String, Object> state = jdbc.queryForMap("SELECT pity, drops_today, drops_day FROM quiz_drop_state WHERE user_id = ?", userId);
        int pity = ((Number) state.get("pity")).intValue();
        int dropsToday = ((Number) state.get("drops_today")).intValue();
        Object day = state.get("drops_day");
        if (day == null || !day.toString().startsWith(today().toString())) dropsToday = 0;

        boolean gift = QuizItems.streakGift(streak, settings.streakEvery());
        double chance = QuizItems.dropChance(settings.dropBasePercent() / 100, settings.dropPityStepPercent() / 100, pity,
                settings.dropPityMax(), !correct, settings.dropWrongBonusPercent() / 100);
        boolean rolled = gift || random.nextDouble() < chance;
        String item = null;
        if (rolled && dropsToday < settings.dropDailyCap()) {
            item = QuizItems.pick(weights(), QuizItems.ALL, items(userId), random.nextDouble());
            if (item != null && addItem(userId, item, 1, gift ? "streak" : "drop", null) <= 0) item = null;
        }
        if (item != null) {
            pity = 0;
            dropsToday++;
        } else {
            pity++;
        }
        jdbc.update("UPDATE quiz_drop_state SET pity = ?, drops_today = ?, drops_day = ? WHERE user_id = ?", pity, dropsToday, today(), userId);
        return item;
    }

    private void requireEnabled() {
        if (!funSettings.enabled() || !settings.enabled()) throw new IllegalStateException("Quiz leo rank đang tạm đóng");
    }

}
