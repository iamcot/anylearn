package com.anylearn.backend.service.voucher;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class VoucherRulesTest {

    private static final List<VoucherRules.Line> CART = List.of(new VoucherRules.Line(1, 7, 300_000), new VoucherRules.Line(2, 7, 500_000));

    @Test
    void moneyVoucherTakesItsValueButNeverMoreThanTheCoveredLines() {
        var ev = VoucherRules.evaluate(new VoucherRules.Group("money", 50_000, 0, Set.of()), CART);
        assertTrue(ev.ok());
        assertEquals(50_000, ev.discount());
        assertEquals(800_000, ev.coveredSubtotal());

        var big = VoucherRules.evaluate(new VoucherRules.Group("money", 1_000_000, 0, Set.of(1L)), CART);
        assertEquals(300_000, big.discount());
    }

    @Test
    void aVoucherLimitedToSomeCoursesOnlyCountsThoseLines() {
        var ev = VoucherRules.evaluate(new VoucherRules.Group("money", 50_000, 400_000, Set.of(1L)), CART);
        assertFalse(ev.ok());
        assertEquals(100_000, ev.shortBy());
        assertTrue(ev.problem().contains("các khóa được áp dụng"));

        var none = VoucherRules.evaluate(new VoucherRules.Group("money", 50_000, 0, Set.of(9L)), CART);
        assertFalse(none.ok());
        assertTrue(none.problem().contains("một số khóa học"));

        var ok = VoucherRules.evaluate(new VoucherRules.Group("money", 50_000, 400_000, Set.of(2L)), CART);
        assertTrue(ok.ok());
    }

    @Test
    void otherTypesAndEmptyCartsAreRefused() {
        assertFalse(VoucherRules.evaluate(new VoucherRules.Group("class", 1, 0, Set.of()), CART).ok());
        assertFalse(VoucherRules.evaluate(new VoucherRules.Group("money", 1, 0, Set.of()), List.of()).ok());
        assertFalse(VoucherRules.evaluate(null, CART).ok());
    }

    @Test
    void codeProblems() {
        long now = 1_800_000_000L;
        assertNull(VoucherRules.codeProblem(true, true, 0, 1, false, now));
        assertNotNull(VoucherRules.codeProblem(true, false, 0, 1, false, now));
        assertEquals("Bạn đã dùng mã này rồi", VoucherRules.codeProblem(true, true, 0, 5, true, now));
        assertNotNull(VoucherRules.codeProblem(true, true, 0, 0, false, now));
        assertNotNull(VoucherRules.codeProblem(false, true, 0, 3, false, now));
        assertEquals("Mã khuyến mãi đã hết hạn", VoucherRules.codeProblem(true, true, (int) (now - 1), 1, false, now));
        assertEquals(0, VoucherRules.usesLeft(1, 1));
        assertEquals(1, VoucherRules.usesLeft(null, 0));
        assertEquals(7, VoucherRules.usesLeft(10, 3));
    }

    @Test
    void walletExpiryIsTheEarlierOfDaysAndCodeExpiry() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 3, 10, 0);
        assertNull(VoucherRules.walletExpiry(now, null, 0, ZoneOffset.UTC));
        assertEquals(now.plusDays(30), VoucherRules.walletExpiry(now, 30, 0, ZoneOffset.UTC));
        int codeEnd = (int) now.plusDays(5).toEpochSecond(ZoneOffset.UTC);
        assertEquals(now.plusDays(5), VoucherRules.walletExpiry(now, 30, codeEnd, ZoneOffset.UTC));
        assertEquals(now.plusDays(5), VoucherRules.walletExpiry(now, null, codeEnd, ZoneOffset.UTC));
    }

    @Test
    void generatedCodesUseThePrefixAndAnUnambiguousAlphabet() {
        String c = VoucherRules.generate("al", 8, new Random(1));
        assertTrue(c.startsWith("AL"));
        assertEquals(10, c.length());
        for (char ch : c.substring(2).toCharArray()) assertTrue(VoucherRules.CODE_ALPHABET.indexOf(ch) >= 0);
        assertEquals(6, VoucherRules.generate(null, null, new Random(2)).length());
        assertEquals(4, VoucherRules.generate("", 1, new Random(3)).length());
    }

    @Test
    void eventsAndHelpers() {
        assertTrue(VoucherRules.triggerMatches(0, 55));
        assertTrue(VoucherRules.triggerMatches(55, 55));
        assertFalse(VoucherRules.triggerMatches(54, 55));
        assertEquals(List.of(12L, 15L), VoucherRules.parseIds("12, 15,x,12"));
        assertEquals(List.of(), VoucherRules.parseIds(null));
        assertEquals(30_000, VoucherRules.pointsValue(30, 1000, 500_000));
        assertEquals(20_000, VoucherRules.pointsValue(30, 1000, 20_000));
        assertEquals(0, VoucherRules.pointsValue(0, 1000, 20_000));
        assertEquals("50.000đ", VoucherRules.money(50_000));
        assertEquals(0, VoucherRules.parseValue("abc"));
    }

    @Test
    void aPartnerVoucherCoversOnlyThatPartnersCourses() {
        List<VoucherRules.Line> cart = List.of(new VoucherRules.Line(1, 7, 300_000), new VoucherRules.Line(2, 8, 500_000));
        var mine = VoucherRules.evaluate(new VoucherRules.Group("money", 1_000_000, 0, Set.of(), 8L), cart);
        assertEquals(500_000, mine.discount());
        var other = VoucherRules.evaluate(new VoucherRules.Group("money", 10_000, 0, Set.of(), 9L), cart);
        assertTrue(other.problem().contains("một đối tác"));
        assertTrue(VoucherRules.relatesToPartner(new VoucherRules.Group("money", 1, 0, Set.of(), 8L), 8, Set.of()));
        assertTrue(VoucherRules.relatesToPartner(new VoucherRules.Group("money", 1, 0, Set.of(2L)), 8, Set.of(8L)));
        assertFalse(VoucherRules.relatesToPartner(new VoucherRules.Group("money", 1, 0, Set.of()), 8, Set.of()));
        assertEquals(List.of("home", "fun"), VoucherRules.parsePlaces("home, fun,x"));
        assertTrue(VoucherRules.showsAt(List.of(), "pdp"));
        assertTrue(VoucherRules.showsAt(List.of("fun"), "fun"));
        assertFalse(VoucherRules.showsAt(List.of("fun"), "home"));
    }
}
