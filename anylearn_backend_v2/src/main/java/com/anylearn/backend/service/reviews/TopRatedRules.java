package com.anylearn.backend.service.reviews;

/** Pure rules of the home block "Khóa học được đánh giá cao": how far back reviews count and what the block is called. */
public final class TopRatedRules {

    public static final int DEFAULT_DAYS = 90;
    public static final int MIN_DAYS = 7;
    public static final int MAX_DAYS = 3650;

    private TopRatedRules() {}

    /** A stored value that is missing, not a number or out of range falls back to the default. */
    public static int days(String stored) {
        if (stored == null) return DEFAULT_DAYS;
        try {
            int days = Integer.parseInt(stored.trim());
            return days >= MIN_DAYS && days <= MAX_DAYS ? days : DEFAULT_DAYS;
        } catch (NumberFormatException e) {
            return DEFAULT_DAYS;
        }
    }

    /** Null when fine, otherwise the message to show. */
    public static String problem(Integer days) {
        if (days == null || days < MIN_DAYS || days > MAX_DAYS) {
            return "Khoảng thời gian tính đánh giá cao phải từ " + MIN_DAYS + " đến " + MAX_DAYS + " ngày";
        }
        return null;
    }

    /** Up to 30 days "trong tháng", up to 90 "trong quý", longer has no period in the name. */
    public static String title(int days) {
        if (days <= 30) return "Top khóa học được đánh giá cao trong tháng";
        if (days <= 90) return "Top khóa học được đánh giá cao trong quý";
        return "Top khóa học được đánh giá cao";
    }
}
