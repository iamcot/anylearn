package com.anylearn.backend.service.farm;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class FarmRulesTest {

    private static final FarmRules.Params P = new FarmRules.Params(50, 60, 2, 4, 6, 40, 14);
    private static final LocalDateTime T0 = LocalDateTime.of(2026, 11, 9, 8, 0);

    private static FarmRules.Plot plot(int growMinutes, int needs, int done, int missed, int lost, boolean fert) {
        return new FarmRules.Plot(T0, growMinutes, needs, done, missed, lost, fert, 4);
    }

    @Test
    void emptyPlotIsEmpty() {
        assertEquals(FarmRules.Phase.EMPTY, FarmRules.view(null, T0, P).phase());
    }

    @Test
    void cropWithNoWaterNeedsGrowsThenRipens() {
        FarmRules.Plot p = plot(5, 0, 0, 0, 0, false);
        assertEquals(FarmRules.Phase.GROWING, FarmRules.view(p, T0.plusMinutes(2), P).phase());
        FarmRules.View v = FarmRules.view(p, T0.plusMinutes(5), P);
        assertEquals(FarmRules.Phase.RIPE, v.phase());
        assertEquals(4, v.yieldNow());
    }

    @Test
    void waterCheckpointsAreEvenlySpread() {
        FarmRules.Plot p = plot(120, 2, 0, 0, 0, false);
        assertEquals(T0, FarmRules.checkpoint(p, 1));   // the first watering opens right after sowing
        assertEquals(T0.plusMinutes(60), FarmRules.checkpoint(p, 2));
    }

    @Test
    void becomesThirstyAtTheCheckpointAndSlowsDown() {
        FarmRules.Plot p = plot(120, 1, 0, 0, 0, false);   // checkpoint right after sowing
        assertTrue(FarmRules.view(p, T0, P).needsWater());
        FarmRules.View v = FarmRules.view(p, T0.plusMinutes(30), P);
        assertTrue(v.needsWater());
        assertEquals(FarmRules.Phase.THIRSTY, v.phase());
        // 30 minutes thirsty at 50% speed = 15 minutes lost
        assertEquals(T0.plusMinutes(135), v.ripeAt());
    }

    @Test
    void lateWateringNeverCountsTheSameTimeTwice() {
        FarmRules.Plot p = plot(120, 2, 0, 0, 0, false);   // checkpoints at +0 and +60
        assertEquals(60 * 60 / 2, FarmRules.lostWhenWatered(p, 1, T0.plusMinutes(200), P));   // only +0..+60
        assertEquals(50 * 60 / 2, FarmRules.lostWhenWatered(p, 2, T0.plusMinutes(110), P));
    }

    @Test
    void wateringLateLosesGrowthAndAYieldAfterTheGrace() {
        FarmRules.Plot p = plot(120, 1, 0, 0, 0, false);
        assertEquals(0, FarmRules.lostWhenWatered(p, 1, T0, P));
        assertEquals(30 * 60 / 2, FarmRules.lostWhenWatered(p, 1, T0.plusMinutes(30), P));
        assertFalse(FarmRules.tooLate(p, 1, T0.plusMinutes(40), P));
        assertTrue(FarmRules.tooLate(p, 1, T0.plusMinutes(60), P));
    }

    @Test
    void neverWateredCropStillRipensWithFewerUnitsButNotBelowTheMinimum() {
        FarmRules.Plot p = plot(60, 3, 0, 0, 0, false);
        FarmRules.View v = FarmRules.view(p, T0.plusHours(10), P);
        assertTrue(v.phase() == FarmRules.Phase.RIPE || v.phase() == FarmRules.Phase.WILTING);
        assertTrue(v.yieldNow() >= P.minYield());
        assertTrue(v.yieldNow() < 4);
    }

    @Test
    void fertilizerAddsOneUnit() {
        assertEquals(4, FarmRules.view(plot(5, 0, 0, 0, 0, false), T0.plusMinutes(5), P).yieldNow());
        assertEquals(5, FarmRules.view(plot(5, 0, 0, 0, 0, true), T0.plusMinutes(5), P).yieldNow());
    }

    @Test
    void ripeCropWiltsSlowlyAndStopsAtTheMinimum() {
        FarmRules.Plot p = plot(5, 0, 0, 0, 0, false);       // hold = max(4h, 0h) = 4h, step 6h
        assertEquals(FarmRules.Phase.RIPE, FarmRules.view(p, T0.plusHours(4), P).phase());
        FarmRules.View a = FarmRules.view(p, T0.plusHours(6), P);
        assertEquals(FarmRules.Phase.WILTING, a.phase());
        assertEquals(3, a.yieldNow());
        assertEquals(2, FarmRules.view(p, T0.plusHours(80), P).yieldNow());
    }

    @Test
    void levelsGrowWithXpAndStopAtTheMaximum() {
        assertEquals(1, FarmRules.levelFor(0, P));
        long need1 = FarmRules.xpForNext(1, P);
        assertEquals(40, need1);
        assertEquals(1, FarmRules.levelFor(need1 - 1, P));
        assertEquals(2, FarmRules.levelFor(need1, P));
        assertEquals(FarmRules.MAX_LEVEL, FarmRules.levelFor(Long.MAX_VALUE / 4, P));
        assertTrue(FarmRules.xpForNext(10, P) > FarmRules.xpForNext(5, P));
    }

    @Test
    void dailyPriceStaysInsideTheJitterAndIsTheSameForEveryone() {
        for (int d = 0; d < 60; d++) {
            int price = FarmRules.dailyUnitPrice(100, "bap_rang", LocalDate.of(2026, 11, 1).plusDays(d), 20);
            assertTrue(price >= 80 && price <= 120, "price " + price);
        }
        assertEquals(FarmRules.dailyUnitPrice(6, "x", LocalDate.of(2026, 11, 9), 20), FarmRules.dailyUnitPrice(6, "x", LocalDate.of(2026, 11, 9), 20));
        assertEquals(1, FarmRules.dailyUnitPrice(1, "rau_mam", LocalDate.of(2026, 11, 9), 50) >= 1 ? 1 : 0);
        assertEquals(5, FarmRules.dailyUnitPrice(5, "x", LocalDate.of(2026, 11, 9), 0));
    }

    @Test
    void sellingTheSameCropAgainPaysLess() {
        assertEquals(100, FarmRules.pricePercent(0, 12, 70, 40));
        assertEquals(100, FarmRules.pricePercent(11, 12, 70, 40));
        assertEquals(70, FarmRules.pricePercent(12, 12, 70, 40));
        assertEquals(70, FarmRules.pricePercent(23, 12, 70, 40));
        assertEquals(40, FarmRules.pricePercent(24, 12, 70, 40));
    }

    @Test
    void profitCapGrowsWithLevelButHasAMaximum() {
        assertEquals(8, FarmRules.dailyProfitCap(8, 1, 18, 1));
        assertEquals(13, FarmRules.dailyProfitCap(8, 1, 18, 10));
        assertEquals(18, FarmRules.dailyProfitCap(8, 1, 18, 30));
        assertEquals(18, FarmRules.dailyProfitCap(8, 1, 18, 99));
    }

    @Test
    void roomIsTheSmallerOfDayAndWeekAndNeverNegative() {
        assertEquals(8, FarmRules.profitRoom(8, 0, 70, 0));
        assertEquals(3, FarmRules.profitRoom(8, 5, 70, 10));
        assertEquals(4, FarmRules.profitRoom(8, 0, 70, 66));
        assertEquals(0, FarmRules.profitRoom(8, 9, 70, 0));
        assertEquals(10, FarmRules.profitRoom(8, -2, 70, 0));        // spending on seeds makes room
    }

    @Test
    void marketPaysOnlyWhatFitsUnderTheCap() {
        assertEquals(3, FarmRules.unitsThatFit(new int[]{2, 2, 2, 2}, 6));
        assertEquals(0, FarmRules.unitsThatFit(new int[]{2, 2}, 1));
        assertEquals(2, FarmRules.unitsThatFit(new int[]{2, 2}, 100));
        assertEquals(0, FarmRules.unitsThatFit(new int[]{}, 5));
    }
}
