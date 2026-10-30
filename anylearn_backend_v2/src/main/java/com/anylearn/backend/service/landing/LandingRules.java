package com.anylearn.backend.service.landing;

import com.anylearn.backend.service.seo.SeoRules;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure rules of the landing pages "{môn} cho trẻ {tuổi} tuổi tại {quận}" (plan 19.A7). */
public final class LandingRules {

    private LandingRules() {}

    /** TP Hồ Chí Minh, the first city (decision of 2026-10-29). */
    public static final String PROVINCE_CODE = "79";
    public static final String PROVINCE_NAME = "TP.HCM";
    public static final int MIN_AGE = 3;
    public static final int MAX_AGE = 15;
    public static final int MAX_INTRO = 2000;
    public static final List<String> INTRO_STATUSES = List.of("none", "draft", "approved");

    private static final Pattern PATH = Pattern.compile("^([a-z0-9-]{1,80})/(\\d{1,2})-tuoi/([a-z0-9-]{1,80})$");

    public record Parts(String tagSlug, int age, String districtSlug) {}

    public static String path(String tagName, int age, String districtName) {
        return SeoRules.slug(tagName) + "/" + age + "-tuoi/" + SeoRules.slug(districtName);
    }

    /** "boi/5-tuoi/quan-7" → parts; anything else (wrong shape, age out of range) → null. */
    public static Parts parse(String raw) {
        if (raw == null) return null;
        Matcher m = PATH.matcher(raw.trim().replaceAll("^/+|/+$", "").toLowerCase(Locale.ROOT));
        if (!m.matches()) return null;
        int age = Integer.parseInt(m.group(2));
        if (age < MIN_AGE || age > MAX_AGE) return null;
        return new Parts(m.group(1), age, m.group(3));
    }

    /** A page is shown only with at least SeoRules.LANDING_MIN_COURSES real courses. */
    public static boolean enoughCourses(long count) {
        return count >= SeoRules.LANDING_MIN_COURSES;
    }

    /** "Bơi cho trẻ 5 tuổi tại Quận 7, TP.HCM". */
    public static String title(String tagName, int age, String districtName) {
        return capitalize(tagName) + " cho trẻ " + age + " tuổi tại " + districtName + ", " + PROVINCE_NAME;
    }

    public static String metaDescription(String tagName, int age, String districtName, long count) {
        return count + " khóa " + tagName.toLowerCase(Locale.ROOT) + " phù hợp trẻ " + age + " tuổi ở " + districtName + ", " + PROVINCE_NAME
                + ": so sánh học phí, lịch học, đánh giá thật của phụ huynh và đăng ký trên anyLEARN.";
    }

    /** The introduction shown until an admin approves one of their own (or the AI's after review). */
    public static String defaultIntro(String tagName, int age, String districtName, long count) {
        String subject = tagName.toLowerCase(Locale.ROOT);
        return "Đang tìm lớp " + subject + " cho bé " + age + " tuổi gần nhà ở " + districtName + "? anyLEARN gom " + count
                + " khóa " + subject + " nhận trẻ " + age + " tuổi tại " + districtName + ", " + PROVINCE_NAME
                + ", kèm học phí, lịch học và đánh giá của phụ huynh đã cho con học. Bạn so sánh vài khóa, xem lớp nào có học thử, rồi đăng ký ngay trên anyLEARN.";
    }

    public static String cleanIntro(String raw) {
        String text = raw == null ? null : raw.trim();
        if (text == null || text.isEmpty()) return null;
        if (text.length() > MAX_INTRO) throw new IllegalArgumentException("Đoạn giới thiệu tối đa " + MAX_INTRO + " ký tự");
        return text;
    }

    public static String cleanIntroStatus(String raw) {
        String status = raw == null ? "none" : raw.trim().toLowerCase(Locale.ROOT);
        if (!INTRO_STATUSES.contains(status)) throw new IllegalArgumentException("Trạng thái không hợp lệ");
        return status;
    }

    /** Price in đồng as "1.200.000đ". */
    public static String price(long vnd) {
        return NumberFormat.getIntegerInstance(Locale.forLanguageTag("vi-VN")).format(vnd) + "đ";
    }

    /**
     * Questions and answers of a page, built only from figures of the page (no promise beyond what the site shows).
     * `priceMin`/`priceMax` null = unknown; `freeTrial` = courses with a free trial among those shown.
     */
    public static List<Map<String, String>> faq(String tagName, int age, String districtName, long count, Long priceMin, Long priceMax, long freeTrial) {
        String subject = tagName.toLowerCase(Locale.ROOT);
        List<Map<String, String>> out = new ArrayList<>();
        out.add(qa("Có bao nhiêu khóa " + subject + " cho trẻ " + age + " tuổi ở " + districtName + "?",
                "Hiện có " + count + " khóa " + subject + " nhận trẻ " + age + " tuổi tại " + districtName + " trên anyLEARN. Danh sách cập nhật mỗi ngày khi trường mở lớp mới."));
        if (priceMin != null && priceMax != null && priceMax > 0) {
            String range = priceMin.equals(priceMax) ? price(priceMin) : "từ " + price(priceMin) + " đến " + price(priceMax);
            out.add(qa("Học phí lớp " + subject + " cho bé " + age + " tuổi khoảng bao nhiêu?",
                    "Học phí các khóa đang mở " + range + " mỗi khóa, tùy số buổi và trung tâm. Giá trên anyLEARN bằng hoặc rẻ hơn giá tại trường."));
        }
        if (freeTrial > 0) {
            out.add(qa("Có lớp " + subject + " cho học thử miễn phí không?",
                    "Có " + freeTrial + " khóa trong danh sách cho học thử miễn phí. Bạn bấm vào khóa để xem lịch học thử và đăng ký."));
        }
        out.add(qa("Đăng ký qua anyLEARN có lợi gì?",
                "Giá bằng hoặc rẻ hơn tại trường, nhận anyPoint để giảm cho khóa sau, mọi lịch học của các bé ở một nơi. Đăng ký mà lớp không mở thì được hoàn tiền."));
        return out;
    }

    private static Map<String, String> qa(String question, String answer) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("question", question);
        m.put("answer", answer);
        return m;
    }

    private static String capitalize(String text) {
        if (text == null || text.isBlank()) return "";
        String t = text.trim();
        return t.substring(0, 1).toUpperCase(Locale.ROOT) + t.substring(1);
    }
}
