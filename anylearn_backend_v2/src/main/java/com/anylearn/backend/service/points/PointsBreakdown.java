package com.anylearn.backend.service.points;

import java.util.List;

/**
 * Immutable result of one PointsEngine.calculate() call.
 * All point amounts in anyPoints. companyRevenueVnd is in VND.
 */
public record PointsBreakdown(
        long authorPoints,          // wallet_c credit for item author/teacher
        long buyerPoints,           // wallet_c credit for buyer
        List<Long> referralAmounts, // per-level referral credit (same amount per level)
        long refSellerPoints,       // wallet_c credit for author's referrer (if eligible)
        long foundationPoints,      // anyPoints for foundation fund (accounting only — no wallet_c credit)
        long companyRevenueVnd,     // VND the company retains after all point distributions
        boolean disabled            // true when commissionRate == -1
) {
    /** commissionRate == -1: no distributions, company keeps full price */
    public static PointsBreakdown noCommission(long paidPrice) {
        return new PointsBreakdown(0, 0, List.of(), 0, 0, paidPrice, true);
    }
}
