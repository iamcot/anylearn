package com.anylearn.backend.service.points;

import java.util.Map;

/**
 * Immutable config snapshot used by PointsEngine.
 * Resolved once per order-item from: item.company_commission JSON > global config table.
 */
public record CommissionConfig(
        double bonusRate,         // VND per 1 anyPoint (default 1000)
        double discount,          // buyer direct anyPoint rate (default 0.1)
        double commission,        // referral chain anyPoint rate per level (default 0.2)
        double bonusRefSeller,    // ref-seller anyPoint rate (default 0.0)
        double bonusFoundation,   // foundation fund rate as fraction of price (default 0.0)
        int    friendTree         // referral depth (default 2)
) {
    public static final double DEFAULT_BONUS_RATE      = 1000.0;
    public static final double DEFAULT_DISCOUNT        = 0.1;
    public static final double DEFAULT_COMMISSION      = 0.2;
    public static final double DEFAULT_BONUS_REF_SELLER   = 0.0;
    public static final double DEFAULT_BONUS_FOUNDATION   = 0.0;
    public static final int    DEFAULT_FRIEND_TREE     = 2;

    public static CommissionConfig defaults() {
        return new CommissionConfig(
                DEFAULT_BONUS_RATE, DEFAULT_DISCOUNT, DEFAULT_COMMISSION,
                DEFAULT_BONUS_REF_SELLER, DEFAULT_BONUS_FOUNDATION, DEFAULT_FRIEND_TREE
        );
    }

    public static CommissionConfig fromMap(Map<String, String> configMap) {
        return new CommissionConfig(
                parseDouble(configMap, "bonus_rate",       DEFAULT_BONUS_RATE),
                parseDouble(configMap, "discount",         DEFAULT_DISCOUNT),
                parseDouble(configMap, "commission",       DEFAULT_COMMISSION),
                parseDouble(configMap, "bonus_ref_seller", DEFAULT_BONUS_REF_SELLER),
                parseDouble(configMap, "bonus_foundation", DEFAULT_BONUS_FOUNDATION),
                (int) parseDouble(configMap, "friend_tree", DEFAULT_FRIEND_TREE)
        );
    }

    private static double parseDouble(Map<String, String> map, String key, double def) {
        String v = map.get(key);
        if (v == null) return def;
        try { return Double.parseDouble(v); } catch (NumberFormatException e) { return def; }
    }
}
