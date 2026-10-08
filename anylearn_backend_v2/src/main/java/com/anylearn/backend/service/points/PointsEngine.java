package com.anylearn.backend.service.points;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Pure calculation engine for anyPoint distribution.
 * No repository dependencies — fully unit-testable without a Spring context.
 *
 * Formulas (mirroring portal TransactionService):
 *   authorPoints    = floor( price × commRate / bonusRate )
 *   buyerPoints     = round( price × (1 − commRate) × discount    / bonusRate )
 *   referralPoints  = round( price × (1 − commRate) × commission  / bonusRate )  // same per level
 *   refSellerPoints = round( price × (1 − commRate) × bonusRefSeller / bonusRate )
 *   foundationVnd   = round( price × (1 − commRate) × bonusFoundation )           // in VND
 */
@Component
public class PointsEngine {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Resolve effective commission rate.
     * Priority: item override > author rate > systemDefault.
     * Special: -1 = no anyPoint distributions (company keeps all revenue, no partner/buyer/foundation txs).
     *          To give partner 100%, set commission_rate = 1.0 on the item explicitly.
     */
    public double resolveCommissionRate(Double itemRate, Double authorRate, double systemDefault) {
        if (itemRate != null && itemRate == -1.0) return -1.0;
        if (itemRate != null && itemRate > 0) return itemRate;
        if (authorRate != null && authorRate > 0) return authorRate;
        return systemDefault;
    }

    /**
     * Override CommissionConfig rates with values from item.company_commission JSON.
     * Only non-null keys in JSON override the base config.
     */
    public CommissionConfig mergeCompanyCommission(CommissionConfig base, String companyCommissionJson) {
        if (companyCommissionJson == null || companyCommissionJson.isBlank()) return base;
        try {
            Map<String, Object> json = MAPPER.readValue(companyCommissionJson,
                    new TypeReference<Map<String, Object>>() {});
            return new CommissionConfig(
                    base.bonusRate(),
                    getDoubleOrDefault(json, "discount",          base.discount()),
                    getDoubleOrDefault(json, "commission",        base.commission()),
                    getDoubleOrDefault(json, "bonus_ref_seller",  base.bonusRefSeller()),
                    getDoubleOrDefault(json, "bonus_foundation",  base.bonusFoundation()),
                    base.friendTree()
            );
        } catch (Exception e) {
            return base;
        }
    }

    /**
     * Calculate full anyPoint distribution for one order-detail line.
     *
     * @param paidPrice      price actually paid (VND)
     * @param commissionRate resolved commission rate (call resolveCommissionRate() first)
     * @param config         merged config (call mergeCompanyCommission() first)
     * @param referralDepth  number of referral levels to calculate (pass buyer's chain length)
     * @param authorHasRefSeller whether the item author's referrer qualifies for refSeller bonus
     */
    public PointsBreakdown calculate(
            long paidPrice,
            double commissionRate,
            CommissionConfig config,
            int referralDepth,
            boolean authorHasRefSeller) {

        if (commissionRate == -1.0) return PointsBreakdown.noCommission(paidPrice);
        if (paidPrice <= 0) return new PointsBreakdown(0, 0, List.of(), 0, 0, 0, false);

        double bonusRate = config.bonusRate();

        // Author gets their commission share (floor)
        long authorPoints = (long) Math.floor(paidPrice * commissionRate / bonusRate);

        // System's share = (1 - commRate) fraction of price
        double systemFraction = 1.0 - commissionRate;

        // Buyer direct reward (round)
        long buyerPoints = Math.round(paidPrice * systemFraction * config.discount() / bonusRate);

        // Referral chain — same amount per level (round)
        long perLevelRefPoints = Math.round(paidPrice * systemFraction * config.commission() / bonusRate);
        int depth = Math.min(referralDepth, config.friendTree());
        List<Long> referralAmounts = depth > 0
                ? Collections.nCopies(depth, perLevelRefPoints)
                : new ArrayList<>();

        // Ref-seller (author's referrer) bonus
        long refSellerPoints = authorHasRefSeller
                ? Math.round(paidPrice * systemFraction * config.bonusRefSeller() / bonusRate)
                : 0L;

        // Foundation fund contribution — in anyPoints (same unit as everything else)
        long foundationPoints = Math.round(paidPrice * systemFraction * config.bonusFoundation() / bonusRate);

        // Company net revenue: price minus the VND equivalent of all distributed points
        long totalDistributedVnd = (authorPoints + buyerPoints
                + referralAmounts.stream().mapToLong(Long::longValue).sum()
                + refSellerPoints + foundationPoints) * (long) bonusRate;
        long companyRevenueVnd = Math.max(0, paidPrice - totalDistributedVnd);

        return new PointsBreakdown(
                authorPoints, buyerPoints, referralAmounts,
                refSellerPoints, foundationPoints, companyRevenueVnd, false
        );
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private double getDoubleOrDefault(Map<String, Object> map, String key, double def) {
        Object v = map.get(key);
        if (v == null) return def;
        try { return ((Number) v).doubleValue(); } catch (Exception e) { return def; }
    }
}
