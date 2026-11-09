package com.anylearn.backend.service.farm;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Pure rules of Nông trại anyLEARN (plan 22): plot state from time, yield, levels, market prices and the net-profit cap.
 * Nothing here reads the database or the clock; the service passes everything in so the rules are easy to test.
 */
public final class FarmRules {

    private FarmRules() {}

    public enum Phase { EMPTY, GROWING, THIRSTY, RIPE, WILTING }

    /** Tunable numbers the rules need (read from {@link FarmSettings}). */
    public record Params(int thirstySpeedPct, int thirstGraceMinutes, int minYield, int ripeHoursMin, int wiltStepHours,
                         int xpBase, int xpExpTenths) {}

    /** What is planted in one plot. */
    public record Plot(LocalDateTime plantedAt, int growMinutes, int waterNeeds, int watersDone, int missedWaters, int lostSeconds,
                       boolean fertilized, int baseYield) {}

    public record View(Phase phase, LocalDateTime ripeAt, int yieldNow, int missedNow, int wiltedUnits, LocalDateTime nextWaterAt,
                       boolean needsWater, int secondsToRipe) {}

    /** Moment the i-th watering (1-based) opens: the plant is {@code i/(needs+1)} of the way through its growing time. */
    public static LocalDateTime checkpoint(Plot p, int i) {
        long seconds = (long) p.growMinutes() * 60L * i / (p.waterNeeds() + 1);
        return p.plantedAt().plusSeconds(seconds);
    }

    /**
     * Seconds of growth lost when watering checkpoint {@code i} at {@code at}: the plant grows slower while thirsty. The thirsty
     * time of checkpoint i runs from its own moment to the next checkpoint (or to {@code at}), so late waterings never count a
     * stretch of time twice.
     */
    public static int lostWhenWatered(Plot p, int i, LocalDateTime at, Params params) {
        LocalDateTime from = checkpoint(p, i);
        LocalDateTime to = i < p.waterNeeds() && checkpoint(p, i + 1).isBefore(at) ? checkpoint(p, i + 1) : at;
        long late = Duration.between(from, to).getSeconds();
        if (late <= 0) return 0;
        return (int) (late * (100 - params.thirstySpeedPct()) / 100);
    }

    /** True when watering at {@code at} is later than the grace period (the plant will give one unit less). */
    public static boolean tooLate(Plot p, int i, LocalDateTime at, Params params) {
        return Duration.between(checkpoint(p, i), at).toMinutes() >= params.thirstGraceMinutes();
    }

    public static View view(Plot p, LocalDateTime now, Params params) {
        if (p == null || p.plantedAt() == null) return new View(Phase.EMPTY, null, 0, 0, 0, null, false, 0);
        int next = p.watersDone() + 1;
        LocalDateTime nextAt = next <= p.waterNeeds() ? checkpoint(p, next) : null;
        boolean thirsty = nextAt != null && !now.isBefore(nextAt);
        long extraLost = thirsty ? Duration.between(nextAt, now).getSeconds() * (100 - params.thirstySpeedPct()) / 100 : 0;
        int missed = p.missedWaters();
        for (int i = next; i <= p.waterNeeds(); i++) {
            LocalDateTime cp = checkpoint(p, i);
            if (now.isBefore(cp)) break;
            if (Duration.between(cp, now).toMinutes() >= params.thirstGraceMinutes()) missed++;
        }
        LocalDateTime ripeAt = p.plantedAt().plusMinutes(p.growMinutes()).plusSeconds(p.lostSeconds() + extraLost);
        int baseLeft = Math.max(p.baseYield() + (p.fertilized() ? 1 : 0) - missed, params.minYield());
        if (now.isBefore(ripeAt)) {
            return new View(thirsty ? Phase.THIRSTY : Phase.GROWING, ripeAt, baseLeft, missed, 0, nextAt, thirsty, (int) Duration.between(now, ripeAt).getSeconds());
        }
        long holdHours = Math.max(params.ripeHoursMin(), p.growMinutes() / 60);
        long overHours = Duration.between(ripeAt, now).toHours() - holdHours;
        int wilted = overHours <= 0 ? 0 : (int) (overHours / Math.max(params.wiltStepHours(), 1)) + 1;
        int yield = Math.max(baseLeft - wilted, params.minYield());
        return new View(wilted > 0 ? Phase.WILTING : Phase.RIPE, ripeAt, yield, missed, Math.min(wilted, Math.max(baseLeft - params.minYield(), 0)), nextAt, thirsty, 0);
    }

    // ---- levels ----

    /** XP needed to go from level {@code level} to the next. */
    public static long xpForNext(int level, Params params) {
        return Math.round(params.xpBase() * Math.pow(level, params.xpExpTenths() / 10.0));
    }

    public static final int MAX_LEVEL = 30;

    /** The level a player with {@code totalXp} is at (starts at 1). */
    public static int levelFor(long totalXp, Params params) {
        int level = 1;
        long left = Math.max(totalXp, 0);
        while (level < MAX_LEVEL) {
            long need = xpForNext(level, params);
            if (left < need) break;
            left -= need;
            level++;
        }
        return level;
    }

    // ---- market and profit cap ----

    /** Today's price of one unit: base price x a daily factor between (100 - jitter)% and (100 + jitter)%, the same for everyone. */
    public static int dailyUnitPrice(int basePrice, String cropKey, java.time.LocalDate day, int jitterPct) {
        int h = Math.abs((cropKey + "|" + day).hashCode() % 1001);        // 0..1000
        double factor = 1.0 + ((h / 1000.0) * 2 - 1) * (jitterPct / 100.0);
        return Math.max((int) Math.round(basePrice * factor), basePrice > 0 ? 1 : 0);
    }

    /** Percent of the price paid for the (alreadySold + 1)-th unit of one crop today: full up to {@code fullUnits}, then the steps. */
    public static int pricePercent(int alreadySold, int fullUnits, int step1Pct, int step2Pct) {
        if (alreadySold < fullUnits) return 100;
        if (alreadySold < fullUnits * 2) return step1Pct;
        return step2Pct;
    }

    /** Daily cap of net profit (coins earned minus coins spent in the farm) for a player level. */
    public static int dailyProfitCap(int base, int perTwoLevels, int max, int level) {
        return Math.min(base + perTwoLevels * (level / 2), max);
    }

    /** Coins the market may still pay: the smaller of what is left of the day and of the week (never below 0). */
    public static int profitRoom(int dayCap, int dayNet, int weekCap, int weekNet) {
        return Math.max(Math.min(dayCap - dayNet, weekCap - weekNet), 0);
    }

    /** How many of {@code wanted} units fit when each unit pays {@code unitCoins}[k] in order; stops at the first one that does not fit. */
    public static int unitsThatFit(int[] unitCoins, int room) {
        int total = 0;
        int n = 0;
        for (int c : unitCoins) {
            if (total + c > room) break;
            total += c;
            n++;
        }
        return n;
    }
}
