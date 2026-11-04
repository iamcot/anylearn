package com.anylearn.backend.service.journey;

import java.util.*;

/**
 * "Hành trình anyLEARN" (plan 21): one-time system missions in 5 chapters that lead a new family to the first order and
 * back to class. Every mission is checked on real data (nothing to press "done"); a mission or a chapter pays once.
 * Chapters 4 and 5 open after the first paid order. Optional missions do not block their chapter.
 */
public final class JourneyRules {

    private JourneyRules() {}

    /** key, chapter, label, hint (what to do), route (where to do it), default coins, optional, gives a sticker. */
    public record Def(String key, int chapter, String label, String hint, String route, int defCoins, boolean optional, boolean sticker) {}

    public record Chapter(int no, String title, String gift) {}

    public static final List<Chapter> CHAPTERS = List.of(
            new Chapter(1, "Làm quen", "Sticker hiếm + góp quỹ Foundation"),
            new Chapter(2, "Tìm lớp", "Phiếu ưu đãi đơn đầu"),
            new Chapter(3, "Học thử", "Huy hiệu \"Nhà hảo tâm nhỏ\""),
            new Chapter(4, "Đi học", "Sticker hiếm"),
            new Chapter(5, "Lan tỏa", "Huy hiệu \"Đại sứ anyLEARN\""));

    public static final List<Def> DEFS = List.of(
            new Def("add_child", 1, "Thêm bé với ngày sinh đầy đủ", "Thêm bé để Leo gợi ý lớp vừa tuổi", "/account/children", 50, false, false),
            new Def("interests", 1, "Trả lời khảo sát sở thích của bé", "Cho Leo biết bé thích gì", "/account/children", 50, false, false),
            new Def("home_address", 1, "Lưu địa chỉ nhà bạn", "Ghi địa chỉ trong hồ sơ để tìm lớp gần nhà", "/account/profile", 30, false, false),
            new Def("install_app", 1, "Thêm anyLEARN vào màn hình chính", "Cài app để mở nhanh hơn", "/info", 0, true, true),
            new Def("notifications", 1, "Bật thông báo", "Bật thông báo để không lỡ lịch học", "/account/notifications", 30, true, false),
            new Def("ai_suggest", 2, "Xem gợi ý AI cho bé", "Xem các khóa Leo chọn cho bé", "/today", 50, false, false),
            new Def("near_search", 2, "Tìm lớp \"Gần tôi\" hoặc xem bản đồ", "Bật bộ lọc Gần tôi ở trang tìm kiếm", "/search", 30, false, false),
            new Def("compare", 2, "So sánh 2 khóa học", "Bấm \"+ So sánh\" trên 2 khóa rồi xem bảng", "/search", 30, false, false),
            new Def("fav3", 2, "Thích 3 khóa học", "Bấm tim trên khóa bạn quan tâm", "/search", 30, false, false),
            new Def("follow", 2, "Theo dõi 1 trường", "Theo dõi để biết khi trường mở lớp mới", "/search?mode=school", 30, false, false),
            new Def("leo_voucher", 2, "Đổi 1 voucher bằng Leo Xu", "Chơi Vui học lấy Leo Xu rồi đổi voucher giảm học phí", "/fun/shop?tab=buy&game=voucher", 20, true, false),
            new Def("course_request", 2, "Nhờ anyLEARN \"Tìm giúp tôi\"", "Chưa thấy lớp hợp? Nhờ anyLEARN tìm", "/search", 30, true, false),
            new Def("free_lesson", 3, "Học 1 bài video miễn phí", "Xem bài \"Học thử miễn phí\" của một khóa video", "/search", 50, false, false),
            new Def("trial", 3, "Đăng ký 1 buổi học thử", "Chọn khóa có học thử và đăng ký", "/search?freeTrial=1", 50, true, false),
            new Def("first_order", 3, "Mua khóa học đầu tiên", "Đăng ký khóa học đầu tiên cho bé", "/search", 100, false, false),
            new Def("attend", 4, "Điểm danh buổi học đầu tiên", "Bấm điểm danh khi bé đến lớp", "/today", 50, false, false),
            new Def("chat_rules", 4, "Vào nhóm lớp và đọc nội quy", "Làm quen phụ huynh cùng lớp", "/community", 30, true, false),
            new Def("survey", 4, "Trả lời khảo sát giữa khóa", "Cho anyLEARN biết bé học thế nào", "/today", 30, true, false),
            new Def("review_photo", 4, "Viết đánh giá có ảnh", "Đánh giá khóa học ở Lịch học", "/account/schedule", 50, false, false),
            new Def("share", 5, "Chia sẻ 1 bài Khám phá hoặc banner", "Chia sẻ một bài hay cho bạn bè", "/fun", 30, false, false),
            new Def("invite", 5, "Mời 1 bạn đăng ký", "Gửi link giới thiệu cho bạn bè", "/account/rewards", 0, false, true),
            new Def("friend_buys", 5, "Bạn được mời mua khóa đầu tiên", "Cả hai cùng nhận quà khi bạn mua", "/account/rewards", 100, false, false));

    public static Optional<Def> def(String key) {
        return DEFS.stream().filter(d -> d.key().equals(key)).findFirst();
    }

    /** Chapters 1 to 3 are always open; 4 and 5 open after the first paid order. */
    public static boolean chapterOpen(int chapter, boolean hasOrder) {
        return chapter <= 3 || hasOrder;
    }

    /** A chapter is complete when every required, switched-on mission of it is done (a chapter with none is not). */
    public static boolean chapterComplete(int chapter, Set<String> done, Set<String> enabled) {
        boolean any = false;
        for (Def d : DEFS) {
            if (d.chapter() != chapter || d.optional() || !enabled.contains(d.key())) continue;
            any = true;
            if (!done.contains(d.key())) return false;
        }
        return any;
    }

    /** The next mission to show: the first open, switched-on, not done one (required before optional), or empty. */
    public static Optional<Def> next(Set<String> done, Set<String> enabled, boolean hasOrder) {
        for (boolean optional : new boolean[]{false, true}) {
            for (Def d : DEFS) {
                if (d.optional() != optional || !enabled.contains(d.key()) || done.contains(d.key())) continue;
                if (!chapterOpen(d.chapter(), hasOrder)) continue;
                return Optional.of(d);
            }
        }
        return Optional.empty();
    }

    public static String chapterKey(int chapter) { return "chapter:" + chapter; }
}
