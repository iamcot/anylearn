package com.anylearn.backend.service.points;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Pure unit tests for PointsEngine — no Spring context required.
 * Each test verifies a specific rule from the commission distribution spec.
 */
class PointsEngineTest {

    private PointsEngine engine;
    private CommissionConfig defaultConfig;

    // Typical scenario values
    private static final long  PRICE      = 1_000_000L;  // 1,000,000 VND
    private static final double COMM_RATE  = 0.20;        // 20% to author

    @BeforeEach
    void setUp() {
        engine = new PointsEngine();
        defaultConfig = CommissionConfig.defaults();
    }

    // ── resolveCommissionRate ─────────────────────────────────────────────────

    @Test
    void resolveRate_itemOverridesAuthor() {
        assertThat(engine.resolveCommissionRate(0.30, 0.20, 0.15)).isEqualTo(0.30);
    }

    @Test
    void resolveRate_authorFallbackWhenItemNull() {
        assertThat(engine.resolveCommissionRate(null, 0.25, 0.15)).isEqualTo(0.25);
    }

    @Test
    void resolveRate_systemDefaultWhenBothNull() {
        assertThat(engine.resolveCommissionRate(null, null, 0.18)).isEqualTo(0.18);
    }

    @Test
    void resolveRate_minusOneDisables() {
        assertThat(engine.resolveCommissionRate(-1.0, 0.20, 0.15)).isEqualTo(-1.0);
    }

    @Test
    void resolveRate_itemZeroFallsBackToAuthor() {
        // item rate 0 is treated as "not set" — use author rate
        assertThat(engine.resolveCommissionRate(0.0, 0.25, 0.15)).isEqualTo(0.25);
    }

    // ── disabled case (-1) ────────────────────────────────────────────────────

    @Test
    void calculate_disabledWhenRateMinusOne() {
        PointsBreakdown b = engine.calculate(PRICE, -1.0, defaultConfig, 2, false);
        assertThat(b.disabled()).isTrue();
        assertThat(b.authorPoints()).isZero();
        assertThat(b.buyerPoints()).isZero();
        assertThat(b.referralAmounts()).isEmpty();
        assertThat(b.refSellerPoints()).isZero();
        assertThat(b.foundationPoints()).isZero();
        assertThat(b.companyRevenueVnd()).isEqualTo(PRICE); // company keeps everything
    }

    // ── zero price ────────────────────────────────────────────────────────────

    @Test
    void calculate_zeroPriceYieldsAllZero() {
        PointsBreakdown b = engine.calculate(0L, COMM_RATE, defaultConfig, 2, false);
        assertThat(b.disabled()).isFalse();
        assertThat(b.authorPoints()).isZero();
        assertThat(b.buyerPoints()).isZero();
        assertThat(b.referralAmounts()).isEmpty();
    }

    // ── author commission (floor) ─────────────────────────────────────────────

    @Test
    void calculate_authorUsesFloor() {
        // price=1000, commRate=0.2, bonusRate=1000 → 1000 * 0.2 / 1000 = 0.2 → floor = 0
        PointsBreakdown b = engine.calculate(1000L, 0.20, defaultConfig, 0, false);
        assertThat(b.authorPoints()).isEqualTo(0L);  // floor(0.2) = 0
    }

    @Test
    void calculate_authorPointsTypicalCase() {
        // 1_000_000 * 0.20 / 1000 = 200.0 → floor = 200
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 0, false);
        assertThat(b.authorPoints()).isEqualTo(200L);
    }

    // ── buyer commission (round, from system share) ───────────────────────────

    @Test
    void calculate_buyerPointsUsesSystemShare() {
        // systemFraction = 1 - 0.20 = 0.80
        // buyerPoints = round(1_000_000 * 0.80 * 0.10 / 1000) = round(80) = 80
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 0, false);
        assertThat(b.buyerPoints()).isEqualTo(80L);
    }

    @Test
    void calculate_buyerPointsZeroCommissionRate() {
        // commRate=0 → systemFraction=1.0 → buyer gets full system share
        // round(1_000_000 * 1.0 * 0.10 / 1000) = 100
        PointsBreakdown b = engine.calculate(PRICE, 0.0, defaultConfig, 0, false);
        assertThat(b.buyerPoints()).isEqualTo(100L);
        assertThat(b.authorPoints()).isEqualTo(0L);
    }

    // ── referral chain ────────────────────────────────────────────────────────

    @Test
    void calculate_referralDepthRespectedByConfig() {
        // friendTree default = 2; pass referralDepth = 2
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 2, false);
        assertThat(b.referralAmounts()).hasSize(2);
        // each = round(1_000_000 * 0.80 * 0.20 / 1000) = round(160) = 160
        assertThat(b.referralAmounts()).containsOnly(160L);
    }

    @Test
    void calculate_referralDepthLimitedByConfig() {
        // buyer chain = 5 levels but friendTree config = 2 → only 2 levels
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 5, false);
        assertThat(b.referralAmounts()).hasSize(2);
    }

    @Test
    void calculate_noReferralWhenDepthZero() {
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 0, false);
        assertThat(b.referralAmounts()).isEmpty();
    }

    @Test
    void calculate_allLevelsGetSameAmount() {
        CommissionConfig config = new CommissionConfig(1000, 0.1, 0.15, 0, 0, 3);
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, config, 3, false);
        assertThat(b.referralAmounts()).hasSize(3);
        long expected = Math.round(PRICE * 0.80 * 0.15 / 1000); // round(120) = 120
        assertThat(b.referralAmounts()).containsOnly(expected);
    }

    // ── refSeller ─────────────────────────────────────────────────────────────

    @Test
    void calculate_refSellerZeroWhenNotEligible() {
        CommissionConfig config = new CommissionConfig(1000, 0.1, 0.2, 0.05, 0, 2);
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, config, 0, false); // authorHasRefSeller=false
        assertThat(b.refSellerPoints()).isZero();
    }

    @Test
    void calculate_refSellerCorrectWhenEligible() {
        CommissionConfig config = new CommissionConfig(1000, 0.1, 0.2, 0.05, 0, 2);
        // refSellerPoints = round(1_000_000 * 0.80 * 0.05 / 1000) = round(40) = 40
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, config, 0, true);
        assertThat(b.refSellerPoints()).isEqualTo(40L);
    }

    // ── foundation (anyPoints, not VND) ───────────────────────────────────────

    @Test
    void calculate_foundationInPointsNotVnd() {
        CommissionConfig config = new CommissionConfig(1000, 0.1, 0.2, 0, 0.05, 2);
        // foundationPoints = round(1_000_000 * 0.80 * 0.05 / 1000) = round(40) = 40
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, config, 0, false);
        assertThat(b.foundationPoints()).isEqualTo(40L);
    }

    @Test
    void calculate_foundationZeroByDefault() {
        // defaultConfig has bonusFoundation = 0.0
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 0, false);
        assertThat(b.foundationPoints()).isZero();
    }

    @Test
    void calculate_foundationIsSmallNumber() {
        // Real-world check: with bonus_foundation=0.05, price=186000, R=0.20
        // foundationPoints = round(186000 * 0.80 * 0.05 / 1000) = round(7.44) = 7
        CommissionConfig config = new CommissionConfig(1000, 0.1, 0.2, 0, 0.05, 2);
        PointsBreakdown b = engine.calculate(186_000L, 0.20, config, 0, false);
        assertThat(b.foundationPoints()).isEqualTo(7L); // NOT 7440 (VND)
    }

    // ── company_commission JSON override ──────────────────────────────────────

    @Test
    void mergeCompanyCommission_overridesDiscount() {
        String json = "{\"discount\": 0.15}";
        CommissionConfig merged = engine.mergeCompanyCommission(defaultConfig, json);
        assertThat(merged.discount()).isEqualTo(0.15);
        assertThat(merged.commission()).isEqualTo(defaultConfig.commission()); // unchanged
    }

    @Test
    void mergeCompanyCommission_ignoresNullKeys() {
        String json = "{\"discount\": null, \"commission\": 0.25}";
        CommissionConfig merged = engine.mergeCompanyCommission(defaultConfig, json);
        assertThat(merged.discount()).isEqualTo(defaultConfig.discount()); // unchanged
        assertThat(merged.commission()).isEqualTo(0.25);
    }

    @Test
    void mergeCompanyCommission_noopOnNullJson() {
        CommissionConfig merged = engine.mergeCompanyCommission(defaultConfig, null);
        assertThat(merged).isEqualTo(defaultConfig);
    }

    @Test
    void mergeCompanyCommission_noopOnEmptyJson() {
        CommissionConfig merged = engine.mergeCompanyCommission(defaultConfig, "");
        assertThat(merged).isEqualTo(defaultConfig);
    }

    @Test
    void mergeCompanyCommission_overrideAppliedInCalculation() {
        String json = "{\"discount\": 0.20}";  // double the default 0.10
        CommissionConfig merged = engine.mergeCompanyCommission(defaultConfig, json);
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, merged, 0, false);
        // buyerPoints = round(1_000_000 * 0.80 * 0.20 / 1000) = round(160) = 160
        assertThat(b.buyerPoints()).isEqualTo(160L);
    }

    // ── CommissionConfig.fromMap ───────────────────────────────────────────────

    @Test
    void fromMap_parsesAllKeys() {
        Map<String, String> map = Map.of(
                "bonus_rate", "500",
                "discount", "0.15",
                "commission", "0.25",
                "bonus_ref_seller", "0.03",
                "bonus_foundation", "0.02",
                "friend_tree", "3"
        );
        CommissionConfig c = CommissionConfig.fromMap(map);
        assertThat(c.bonusRate()).isEqualTo(500.0);
        assertThat(c.discount()).isEqualTo(0.15);
        assertThat(c.commission()).isEqualTo(0.25);
        assertThat(c.bonusRefSeller()).isEqualTo(0.03);
        assertThat(c.bonusFoundation()).isEqualTo(0.02);
        assertThat(c.friendTree()).isEqualTo(3);
    }

    @Test
    void fromMap_usesDefaultsForMissingKeys() {
        CommissionConfig c = CommissionConfig.fromMap(Map.of());
        assertThat(c).isEqualTo(CommissionConfig.defaults());
    }

    // ── large price (overflow guard) ──────────────────────────────────────────

    @Test
    void calculate_noOverflowOnLargePrice() {
        long bigPrice = 999_000_000L; // 999 million VND
        assertThatCode(() -> engine.calculate(bigPrice, COMM_RATE, defaultConfig, 2, true))
                .doesNotThrowAnyException();
    }

    // ── companyRevenueVnd ─────────────────────────────────────────────────────

    @Test
    void calculate_companyRevenueIsRemainder() {
        // With P=1_000_000, R=0.20, bonusRate=1000:
        // authorPoints=200, buyer=80, ref=160×2=320, foundation=0(default) → total=600 pts = 600_000 VND
        // companyRevenue = 1_000_000 - 600_000 = 400_000
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, defaultConfig, 2, false);
        long totalDistributedVnd = (b.authorPoints() + b.buyerPoints()
                + b.referralAmounts().stream().mapToLong(Long::longValue).sum()
                + b.refSellerPoints() + b.foundationPoints()) * 1000L;
        assertThat(b.companyRevenueVnd()).isEqualTo(PRICE - totalDistributedVnd);
        assertThat(b.companyRevenueVnd()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void calculate_companyRevenueZeroWhenDisabled() {
        PointsBreakdown b = engine.calculate(0L, COMM_RATE, defaultConfig, 0, false);
        assertThat(b.companyRevenueVnd()).isZero();
    }

    @Test
    void calculate_totalPointsDoNotExceedPriceDividedByBonusRate() {
        CommissionConfig config = new CommissionConfig(1000, 0.1, 0.2, 0.05, 0.03, 2);
        PointsBreakdown b = engine.calculate(PRICE, COMM_RATE, config, 2, true);
        long totalPoints = b.authorPoints()
                + b.buyerPoints()
                + b.referralAmounts().stream().mapToLong(Long::longValue).sum()
                + b.refSellerPoints();
        long maxPossible = PRICE / (long) config.bonusRate();
        assertThat(totalPoints).isLessThanOrEqualTo(maxPossible);
    }
}
