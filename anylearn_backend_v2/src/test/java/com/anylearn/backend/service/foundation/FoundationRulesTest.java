package com.anylearn.backend.service.foundation;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FoundationRulesTest {

    @Test
    void addFinishesHousesAndCarriesTheRest() {
        var r = FoundationRules.add(new FoundationRules.State(3, 40), 80, 50);
        assertEquals(4, r.state().housesBuilt());
        assertEquals(10, r.state().currentAmount());
        assertEquals(List.of(4), r.finished());

        var big = FoundationRules.add(new FoundationRules.State(0, 0), 80, 250);
        assertEquals(3, big.state().housesBuilt());
        assertEquals(10, big.state().currentAmount());
        assertEquals(List.of(1, 2, 3), big.finished());
    }

    @Test
    void changingTheValueOnlyMovesThePercent() {
        // 3 houses + 40 of 80 = 50%; the value becomes 100 → still 3 houses, 40%
        assertEquals(50, FoundationRules.percent(40, 80));
        assertEquals(40, FoundationRules.percent(40, 100));
        // lowered below what was given: 100% "Sắp hoàn thành", finished only by the next contribution
        assertEquals(100, FoundationRules.percent(40, 30));
        var next = FoundationRules.add(new FoundationRules.State(3, 40), 30, 1);
        assertEquals(4, next.state().housesBuilt());
        assertEquals(11, next.state().currentAmount());
    }

    @Test
    void brickLabels() {
        assertEquals("1 viên gạch", FoundationRules.brickLabel(5_000, 10_000, 20_000, 30_000, 200_000));
        assertEquals("1 bao gạch", FoundationRules.brickLabel(15_000, 10_000, 20_000, 30_000, 200_000));
        assertEquals("1 thùng sơn", FoundationRules.brickLabel(20_000, 10_000, 20_000, 30_000, 200_000));
        assertEquals("1 bao xi măng", FoundationRules.brickLabel(45_000, 10_000, 20_000, 30_000, 200_000));
        assertEquals("1 bao xi măng", FoundationRules.brickLabel(150_000, 10_000, 20_000, 30_000, 200_000));
        assertEquals("1 xe tải gạch", FoundationRules.brickLabel(900_000, 10_000, 20_000, 30_000, 200_000));
    }

    @Test
    void namesAndAmounts() {
        assertEquals("Hồng Lan", FoundationRules.publicName("Nguyễn Thị Hồng Lan", false, false));
        assertEquals("Một phụ huynh", FoundationRules.publicName("Nguyễn Lan", true, false));
        assertEquals("Một phụ huynh", FoundationRules.publicName("0901234567", false, false));
        assertEquals("anyLEARN", FoundationRules.publicName(null, false, true));
        assertEquals(40_000, FoundationRules.orderAmount(20, 1000, 2));
        assertEquals(0, FoundationRules.orderAmount(0, 1000, 2));
        assertEquals(3, FoundationRules.bricks(30_000, 10_000));
        assertEquals(1, FoundationRules.bricks(500, 10_000));
    }

    @Test
    void housesAreNamedByOrder() {
        assertEquals("căn đầu tiên", FoundationRules.houseOrdinal(1));
        assertEquals("căn thứ 2", FoundationRules.houseOrdinal(2));
        assertEquals("Căn thứ 7", FoundationRules.houseTitle(7));
    }

    @Test
    void onlyAContributionOfTheHouseBeingBuiltCanBeRemoved() {
        org.junit.jupiter.api.Assertions.assertNull(FoundationRules.removeProblem(3, 2, 50_000, 20_000));
        org.junit.jupiter.api.Assertions.assertNotNull(FoundationRules.removeProblem(2, 2, 50_000, 20_000), "its house is finished");
        org.junit.jupiter.api.Assertions.assertNotNull(FoundationRules.removeProblem(3, 2, 10_000, 20_000), "more than the house has");
    }
}
