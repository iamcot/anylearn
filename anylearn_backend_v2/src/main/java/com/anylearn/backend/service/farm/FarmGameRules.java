package com.anylearn.backend.service.farm;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Pure rules of the rest of Nông trại anyLEARN (plan 22.3 to 22.6): buying plots, orders, daily tasks, chapters, social limits
 * and the reminder. No database, no clock: the services pass everything in.
 */
public final class FarmGameRules {

    private FarmGameRules() {}

    // ---- plots ----

    public static final int START_PLOTS = 4;
    public static final int MAX_PLOTS = 12;
    private static final int[] PLOT_PRICE = {30, 60, 100, 150, 220, 300, 400, 500};      // plots 5..12
    private static final int[] PLOT_LEVEL = {3, 4, 5, 6, 7, 8, 9, 10};

    /** Price of the next plot when the player has {@code owned} plots; -1 when everything is bought. */
    public static int plotPrice(int owned) {
        int i = owned - START_PLOTS;
        return i < 0 || i >= PLOT_PRICE.length ? -1 : PLOT_PRICE[i];
    }

    public static int plotLevel(int owned) {
        int i = owned - START_PLOTS;
        return i < 0 || i >= PLOT_LEVEL.length ? 99 : PLOT_LEVEL[i];
    }

    // ---- orders ----

    public record CropInfo(String key, int unitPrice, int xp, int baseYield) {}

    public record Order(Map<String, Integer> items, int xp, int coins) {}

    /** How many orders are open at once at this level (3, 4 from level 8, 5 from level 15). */
    public static int orderSlots(int level) {
        return level >= 15 ? 5 : level >= 8 ? 4 : 3;
    }

    /**
     * A new order from the crops the player has unlocked: 1 to 3 kinds, 4 to 12 units in all. Reward: XP twice the crops' XP per
     * unit, coins {@code coinPercent}% of their base price (so an order pays a little more than the market, inside the profit cap).
     */
    public static Order newOrder(long seed, List<CropInfo> unlocked, int coinPercent) {
        Random rnd = new Random(seed);
        List<CropInfo> pool = new ArrayList<>(unlocked);
        int kinds = Math.min(1 + rnd.nextInt(3), pool.size());
        int budget = 4 + rnd.nextInt(9);
        Map<String, Integer> items = new LinkedHashMap<>();
        int xp = 0;
        int value = 0;
        for (int k = 0; k < kinds && !pool.isEmpty(); k++) {
            CropInfo c = pool.remove(rnd.nextInt(pool.size()));
            int left = budget - items.values().stream().mapToInt(Integer::intValue).sum();
            int qty = k == kinds - 1 ? Math.max(left, 1) : Math.max(1, Math.min(left - (kinds - k - 1), 1 + rnd.nextInt(Math.max(left / 2, 1))));
            items.put(c.key(), qty);
            xp += 2 * Math.max(1, c.xp() / Math.max(c.baseYield(), 1)) * qty;
            value += c.unitPrice() * qty;
        }
        return new Order(items, xp, (int) Math.round(value * coinPercent / 100.0));
    }

    // ---- daily tasks ----

    public record TaskDef(String key, String label, String kind, int target) {}

    public static final List<TaskDef> TASKS = List.of(
            new TaskDef("plant3", "Gieo 3 ô đất", "plant", 3),
            new TaskDef("water6", "Tưới 6 lần", "water", 6),
            new TaskDef("harvest4", "Thu hoạch 4 ô", "harvest", 4),
            new TaskDef("order1", "Giao 1 đơn hàng", "order", 1),
            new TaskDef("sell1", "Bán nông sản ở chợ 1 lần", "sell", 1),
            new TaskDef("compost1", "Ủ 1 mẻ phân", "compost", 1),
            new TaskDef("fert2", "Bón phân 2 lần", "fertilize", 2));

    /** Small on purpose: the main path pays most of the XP to the next level (see {@link #PATH_PERCENT}). */
    public static final int TASK_XP = 6;
    public static final int TASK_COUNT = 3;

    /** The three tasks of a day for a player: the same all day, different from day to day. Only things anyone can do alone (visits and helping are challenges). */
    public static List<TaskDef> tasksFor(long userId, LocalDate day, boolean hasNeighbors) {
        List<TaskDef> pool = new ArrayList<>(TASKS);
        Random rnd = new Random(userId * 1_000_003L + day.toEpochDay());
        List<TaskDef> out = new ArrayList<>();
        while (out.size() < TASK_COUNT && !pool.isEmpty()) out.add(pool.remove(rnd.nextInt(pool.size())));
        return out;
    }

    // ---- main path: the quests that carry the player to the next level ----

    /** Share of the XP needed for the next level that the main path pays; the rest comes from the crops themselves. */
    public static final int PATH_PERCENT = 75;

    public record PathStep(String key, String label, String kind, int target, int xp) {}

    private static final int[] PATH_WEIGHT = {20, 25, 20, 20, 15};

    /**
     * The chain of quests for a player standing at some level: sow and harvest the newest crop, deliver orders, open a new plot
     * (or feed the plants when none can be bought yet) and sell once. The XP of the steps adds up to {@code percent}% of
     * {@code xpNeed}, the XP to reach the next level. Progress is counted from the moment the level was reached (the service keeps that).
     */
    public static List<PathStep> pathFor(long xpNeed, int percent, String cropKey, String cropName, boolean plotStep, int plotNo) {
        int budget = (int) Math.round(xpNeed * percent / 100.0);
        String[] keys = {"plant", "harvest", "order", plotStep ? "plot" : "fert", "sell"};
        String[] labels = {"Gieo " + cropName + " 3 lần", "Thu hoạch " + cropName + " 3 ô", "Giao 2 đơn hàng",
                plotStep ? "Mở ô đất thứ " + plotNo : "Bón phân 2 lần", "Bán nông sản ở chợ 1 lần"};
        String[] kinds = {"p:" + cropKey, "h:" + cropKey, "order", plotStep ? "plots" : "fertilize", "sell"};
        int[] targets = {3, 3, 2, plotStep ? 1 : 2, 1};
        List<PathStep> out = new ArrayList<>();
        int left = budget;
        for (int i = 0; i < keys.length; i++) {
            int xp = i == keys.length - 1 ? left : (int) Math.round(budget * PATH_WEIGHT[i] / 100.0);
            xp = Math.max(Math.min(xp, left), 0);
            left -= xp;
            out.add(new PathStep(keys[i], labels[i], kinds[i], targets[i], xp));
        }
        return out;
    }

    // ---- challenges: optional, hard or social quests that pay no level XP ----

    public record Challenge(String key, String group, String label, String kind, int target, int coins, int fertilizer) {}

    public static final List<Challenge> CHALLENGES = List.of(
            new Challenge("magic1", "knowledge", "Trồng 1 Cây Tri thức", "plant_magic", 1, 20, 2),
            new Challenge("magic3", "knowledge", "Trồng Cây Tri thức 3 lần", "plant_magic", 3, 40, 3),
            new Challenge("magic10", "knowledge", "Trồng Cây Tri thức 10 lần", "plant_magic", 10, 80, 5),
            new Challenge("friend1", "social", "Kết bạn với 1 hàng xóm", "neighbors", 1, 15, 2),
            new Challenge("visit3", "social", "Ghé thăm 3 vườn", "visit", 3, 15, 2),
            new Challenge("help5", "social", "Tưới hoặc bón giúp 5 lần", "help", 5, 25, 3),
            new Challenge("help20", "social", "Giúp hàng xóm 20 lần", "help", 20, 60, 5),
            new Challenge("days7", "habit", "Chăm vườn 7 ngày khác nhau", "days", 7, 30, 3),
            new Challenge("days30", "habit", "Chăm vườn 30 ngày khác nhau", "days", 30, 100, 8));

    public static Challenge challenge(String key) {
        for (Challenge c : CHALLENGES) if (c.key().equals(key)) return c;
        return null;
    }

    // ---- chapters ----

    /** One quest. {@code kind} is a counter kind, or "level", "plots", "days" (days with any action), "neighbors". */
    public record Quest(String key, String label, String kind, int target) {}

    public record Chapter(int no, String title, String story, int unlockLevel, List<Quest> quests, int coins, boolean dog, boolean freePlot) {}

    public static final List<Chapter> CHAPTERS = List.of(
            new Chapter(1, "Hạt mầm đầu tiên", "Leo nhận lại mảnh vườn cũ của ông Mầm ở Đồi Nắng. Bé Mầm chui lên từ đất chào Leo.", 1, List.of(
                    new Quest("c1plant", "Gieo 4 ô đất", "plant", 4), new Quest("c1water", "Tưới cây 4 lần", "water", 4),
                    new Quest("c1harvest", "Thu hoạch 4 ô", "harvest", 4), new Quest("c1sell", "Bán nông sản ở chợ 1 lần", "sell", 1),
                    new Quest("c1compost", "Ủ 1 mẻ phân", "compost", 1)), 20, false, true),
            new Chapter(2, "Chợ Đồi Nắng", "Cô Thỏ mở quầy chợ dưới chân đồi và cần thật nhiều rau củ tươi.", 1, List.of(
                    new Quest("c2order", "Giao 3 đơn hàng", "order", 3), new Quest("c2level", "Đạt cấp vườn 3", "level", 3),
                    new Quest("c2days", "Chăm vườn 2 ngày khác nhau", "days", 2)), 40, false, false),
            new Chapter(3, "Hạt giống Tri thức", "Một hạt giống phát sáng rơi xuống vườn: nó chỉ nảy mầm khi bé chăm học.", 5, List.of(
                    new Quest("c3magic", "Trồng 1 Cây Tri thức", "plant_magic", 1), new Quest("c3fert", "Bón phân 5 lần", "fertilize", 5),
                    new Quest("c3days", "Chăm vườn 4 ngày khác nhau", "days", 4)), 60, false, false),
            new Chapter(4, "Hàng xóm thân thiện", "Chó Bông về sống ở vườn Leo và dẫn Leo đi chào các vườn xung quanh.", 5, List.of(
                    new Quest("c4neighbors", "Kết bạn với 1 hàng xóm", "neighbors", 1), new Quest("c4help", "Tưới hoặc bón giúp 5 lần", "help", 5),
                    new Quest("c4visit", "Ghé thăm 3 vườn", "visit", 3)), 80, true, false),
            new Chapter(5, "Ngày hội hoa", "Cả Đồi Nắng mở hội hoa: cô Ong Mật bay khắp nơi, đơn hàng chất đầy bảng tin.", 8, List.of(
                    new Quest("c5order", "Giao 10 đơn hàng", "order", 10), new Quest("c5harvest", "Thu hoạch 60 ô", "harvest", 60),
                    new Quest("c5days", "Chăm vườn 10 ngày khác nhau", "days", 10)), 100, false, false),
            new Chapter(6, "Đồi Nắng rực rỡ", "Khu vườn nở rộ, nhà của Leo hoàn thành. Cả làng cùng chúc mừng.", 11, List.of(
                    new Quest("c6harvest", "Thu hoạch 100 ô", "harvest", 100), new Quest("c6plots", "Có 8 ô đất", "plots", 8),
                    new Quest("c6days", "Chăm vườn 14 ngày khác nhau", "days", 14)), 150, false, false));

    public static Chapter chapter(int no) {
        for (Chapter c : CHAPTERS) if (c.no() == no) return c;
        return null;
    }

    public static boolean questDone(int progress, int target) {
        return progress >= target;
    }

    /** A chapter is open when the player reached its level and finished (claimed) the one before. */
    public static boolean chapterOpen(Chapter c, int level, boolean previousClaimed) {
        return level >= c.unlockLevel() && (c.no() == 1 || previousClaimed);
    }

    // ---- social ----

    public record SocialLimits(int helpDaily, int helpReceivedDaily, int stealDaily, int stolenDaily, int minLeft) {}

    /** Why a player may not help a farm now; null when allowed. */
    public static String helpProblem(int helpedToday, int receivedToday, SocialLimits l) {
        if (helpedToday >= l.helpDaily()) return "Hôm nay bạn đã giúp đủ " + l.helpDaily() + " lần rồi, mai giúp tiếp nhé.";
        if (receivedToday >= l.helpReceivedDaily()) return "Vườn này hôm nay đã được giúp nhiều rồi.";
        return null;
    }

    /** Why a flower may not be picked now; null when allowed. {@code minutesAfterRipe} = how long it has stood ripe. */
    public static String stealProblem(boolean stealable, boolean ripe, long minutesAfterRipe, int graceMinutes, int stolenOnPlot, int unitsLeft,
                                      int stolenByActorToday, int stolenFromOwnerToday, boolean ownerAllows, boolean actorAllows,
                                      boolean actorAlreadyStoleHere, SocialLimits l) {
        if (!actorAllows) return "Bạn đã tắt \"Cho hái trộm\" nên cũng không hái được vườn khác.";
        if (!ownerAllows) return "Vườn này đang tắt cho hái trộm.";
        if (!stealable) return "Chỉ hái được hoa.";
        if (!ripe) return "Hoa chưa chín.";
        if (minutesAfterRipe < graceMinutes) return "Chủ vườn còn đang kịp thu hoạch, đợi một lát nhé.";
        if (stolenOnPlot >= 1) return "Ô này đã bị hái rồi.";
        if (unitsLeft <= l.minLeft()) return "Chỉ còn ít hoa, để lại cho chủ vườn nhé.";
        if (stolenByActorToday >= l.stealDaily()) return "Hôm nay bạn đã hái đủ " + l.stealDaily() + " lần.";
        if (actorAlreadyStoleHere) return "Mỗi vườn chỉ hái được 1 lần mỗi ngày.";
        if (stolenFromOwnerToday >= l.stolenDaily()) return "Vườn này hôm nay đã bị hái đủ rồi.";
        return null;
    }

    // ---- reminder ----

    public record PushInput(int plots, int ripe, int wiltingSoon, int hour, int fromHour, int toHour, long hoursSinceVisit,
                            int ignored, long daysSinceLastPush, boolean alreadySentToday) {}

    /**
     * One reminder a day at most, only while there is something worth coming back for and only in the sending hours. After
     * {@code backoffAfter} reminders in a row that were not followed by a visit, one every 3 days; after {@code stopAfter}, none.
     */
    public static boolean shouldPush(PushInput in, int backoffAfter, int stopAfter) {
        if (in.alreadySentToday() || in.plots() <= 0) return false;
        if (in.hour() < in.fromHour() || in.hour() >= in.toHour()) return false;
        if (in.hoursSinceVisit() < 3) return false;
        if (in.ignored() >= stopAfter) return false;
        if (in.ignored() >= backoffAfter && in.daysSinceLastPush() < 3) return false;
        boolean worth = in.ripe() * 2 >= in.plots() || in.wiltingSoon() > 0;
        return worth && in.ripe() > 0;
    }
}
