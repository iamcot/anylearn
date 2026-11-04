package com.anylearn.backend.service.voucher;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 * Pure voucher rules (plan 20): which cart lines a voucher covers, how much it takes off,
 * why a code cannot be used, when a wallet copy expires and how dynamic codes are generated.
 */
public final class VoucherRules {

    private VoucherRules() {}

    public static final String TYPE_MONEY = "money";
    public static final String TYPE_PERCENT = "percent";

    /** A fixed-amount group: "money" in any case, or no type at all (old rows). Other portal types
     *  (e.g. a free class) are not usable at checkout; saving the group in the back office turns it into "money". */
    public static boolean isMoney(String type) {
        return type == null || type.isBlank() || TYPE_MONEY.equalsIgnoreCase(type.trim());
    }

    /** A group that takes `value` percent off the covered lines (capped by maxDiscount when set). */
    public static boolean isPercent(String type) {
        return type != null && TYPE_PERCENT.equalsIgnoreCase(type.trim());
    }

    /** "money" or "percent" for the API; other portal types are reported as they are. */
    public static String kind(String type) {
        return isPercent(type) ? TYPE_PERCENT : isMoney(type) ? TYPE_MONEY : type.trim();
    }

    /** The discount a group gives on a covered subtotal, before the "not more than the lines" cut. */
    public static long rawDiscount(String type, long value, long maxDiscount, long covered) {
        if (isPercent(type)) {
            long pct = Math.min(100, Math.max(0, value));
            long d = Math.max(0, covered) * pct / 100;
            return maxDiscount > 0 ? Math.min(d, maxDiscount) : d;
        }
        return Math.max(0, value);
    }

    /** Short label: "Giảm 50.000đ", "Giảm 10%", "Giảm 10% (tối đa 200.000đ)". */
    public static String label(String type, long value, long maxDiscount) {
        if (isPercent(type)) return "Giảm " + value + "%" + (maxDiscount > 0 ? " (tối đa " + money(maxDiscount) + ")" : "");
        return "Giảm " + money(value);
    }
    public static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

    /** One cart line: the course, its partner and what is paid for it (after the family offer). */
    public record Line(long itemId, long partnerId, long amount) {}

    /**
     * What a voucher group allows: a money value, a minimum on the covered lines, an optional course list
     * (empty = all) and an optional partner (only that partner's courses).
     */
    public record Group(String type, long value, long minOrder, Set<Long> itemIds, Long partnerId, long maxDiscount) {
        public Group(String type, long value, long minOrder, Set<Long> itemIds, Long partnerId) { this(type, value, minOrder, itemIds, partnerId, 0); }
        public Group(String type, long value, long minOrder, Set<Long> itemIds) { this(type, value, minOrder, itemIds, null, 0); }
    }

    /** Whether a group covers a course. */
    public static boolean covers(Group g, long itemId, long partnerId) {
        boolean listed = g.itemIds() != null && !g.itemIds().isEmpty();
        if (listed && !g.itemIds().contains(itemId)) return false;
        return g.partnerId() == null || g.partnerId() <= 0 || g.partnerId() == partnerId;
    }

    /** A group with no places chosen shows everywhere (the course and partner pages still check coverage). */
    public static boolean showsAt(List<String> places, String place) {
        if (place == null || place.isBlank()) return true;
        if (places == null || places.isEmpty()) return true;
        return places.contains(place);
    }

    /** A partner page shows the partner's own vouchers and vouchers limited to some of its courses. */
    public static boolean relatesToPartner(Group g, long partnerId, Set<Long> partnersOfListedItems) {
        if (g.partnerId() != null && g.partnerId() > 0) return g.partnerId() == partnerId;
        return partnersOfListedItems != null && partnersOfListedItems.contains(partnerId);
    }

    public static final List<String> PLACES = List.of("home", "search", "pdp", "partner", "fun", "tier");

    /** "home, fun,x" → [home, fun] (known places only). */
    public static List<String> parsePlaces(String csv) {
        if (csv == null) return List.of();
        java.util.LinkedHashSet<String> out = new java.util.LinkedHashSet<>();
        for (String p : csv.split("[,;\\s]+")) if (PLACES.contains(p.trim())) out.add(p.trim());
        return List.copyOf(out);
    }

    /** Result of checking a group against a cart; problem null = usable. */
    public record Evaluation(long discount, long coveredSubtotal, long shortBy, String problem) {
        public boolean ok() { return problem == null; }
    }

    public static Evaluation evaluate(Group g, List<Line> lines) {
        if (g == null) return new Evaluation(0, 0, 0, "Mã khuyến mãi không hợp lệ");
        if (!isMoney(g.type()) && !isPercent(g.type()))
            return new Evaluation(0, 0, 0, "Mã này thuộc loại voucher cũ, chưa dùng được khi thanh toán trực tuyến, vui lòng liên hệ anyLEARN");
        if (lines == null || lines.isEmpty()) return new Evaluation(0, 0, 0, "Giỏ hàng trống");
        boolean limited = (g.itemIds() != null && !g.itemIds().isEmpty()) || (g.partnerId() != null && g.partnerId() > 0);
        long covered = 0;
        boolean any = false;
        for (Line l : lines) {
            if (covers(g, l.itemId(), l.partnerId())) { covered += Math.max(0, l.amount()); any = true; }
        }
        if (!any) return new Evaluation(0, 0, 0, g.partnerId() != null && g.partnerId() > 0 && (g.itemIds() == null || g.itemIds().isEmpty())
                ? "Mã chỉ áp dụng cho khóa học của một đối tác, giỏ hàng chưa có khóa phù hợp"
                : "Mã chỉ áp dụng cho một số khóa học, giỏ hàng chưa có khóa phù hợp");
        if (g.minOrder() > 0 && covered < g.minOrder()) {
            long shortBy = g.minOrder() - covered;
            String scope = limited ? " (tính trên các khóa được áp dụng)" : "";
            return new Evaluation(0, covered, shortBy, "Áp dụng cho đơn từ " + money(g.minOrder()) + scope + ", còn thiếu " + money(shortBy));
        }
        long discount = Math.min(rawDiscount(g.type(), g.value(), g.maxDiscount(), covered), covered);
        if (discount <= 0) return new Evaluation(0, covered, 0, "Mã khuyến mãi không hợp lệ");
        return new Evaluation(discount, covered, 0, null);
    }

    /**
     * Why a code itself cannot be used (null = fine).
     * expiredEpoch: seconds, 0 or null = never; usesLeft: uses the code still has; usedByMe: the person already used it.
     */
    public static String codeProblem(boolean codeActive, boolean groupActive, Integer expiredEpoch, long usesLeft,
                                     boolean usedByMe, long nowEpoch) {
        if (!groupActive) return "Mã khuyến mãi không còn hiệu lực";
        if (usedByMe) return "Bạn đã dùng mã này rồi";
        if (!codeActive || usesLeft <= 0) return "Mã khuyến mãi đã hết lượt dùng";
        if (expiredEpoch != null && expiredEpoch > 0 && expiredEpoch < nowEpoch) return "Mã khuyến mãi đã hết hạn";
        return null;
    }

    /** Remaining uses of a code: its allowed uses (at least 1) minus recorded uses. */
    public static long usesLeft(Integer allowed, long used) {
        long a = allowed == null || allowed <= 0 ? 1 : allowed;
        return Math.max(0, a - used);
    }

    /** Expiry of a wallet copy: the earlier of now + walletDays (null/<=0 = none) and the code's own expiry. */
    public static LocalDateTime walletExpiry(LocalDateTime now, Integer walletDays, Integer codeExpiredEpoch, ZoneId zone) {
        LocalDateTime byDays = walletDays != null && walletDays > 0 ? now.plusDays(walletDays) : null;
        LocalDateTime byCode = codeExpiredEpoch != null && codeExpiredEpoch > 0
                ? LocalDateTime.ofInstant(Instant.ofEpochSecond(codeExpiredEpoch), zone) : null;
        if (byDays == null) return byCode;
        if (byCode == null) return byDays;
        return byDays.isBefore(byCode) ? byDays : byCode;
    }

    /** A dynamic code: prefix + random characters (length 4 to 16, default 6). */
    public static String generate(String prefix, Integer length, Random random) {
        int n = length == null ? 6 : Math.max(4, Math.min(16, length));
        StringBuilder sb = new StringBuilder(prefix == null ? "" : prefix.trim().toUpperCase());
        for (int i = 0; i < n; i++) sb.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
        return sb.toString();
    }

    /** An event's trigger (course id, 0 = any) matches what happened. */
    public static boolean triggerMatches(long eventTrigger, long happened) {
        return eventTrigger <= 0 || eventTrigger == happened;
    }

    /** "12, 15,x" → [12, 15]; duplicates and junk dropped. */
    public static List<Long> parseIds(String csv) {
        java.util.LinkedHashSet<Long> out = new java.util.LinkedHashSet<>();
        if (csv == null) return List.of();
        for (String p : csv.split("[,;\\s]+")) {
            try { long v = Long.parseLong(p.trim()); if (v > 0) out.add(v); } catch (NumberFormatException ignored) {}
        }
        return List.copyOf(out);
    }

    public static String normalize(String code) {
        return code == null ? "" : code.trim();
    }

    /** VND value of anyPoint used at checkout, never more than what is left to pay. */
    public static long pointsValue(long points, double vndPerPoint, long remaining) {
        if (points <= 0 || remaining <= 0) return 0;
        return Math.min(Math.round(points * vndPerPoint), remaining);
    }

    /** Parse the group's value column ("50000"); anything else = 0. */
    public static long parseValue(String v) {
        if (v == null) return 0;
        try { return Math.max(0, Long.parseLong(v.trim())); } catch (NumberFormatException e) { return 0; }
    }

    public static String money(long v) {
        return String.format("%,d", v).replace(',', '.') + "đ";
    }
}
