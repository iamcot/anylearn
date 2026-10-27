package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.entity.ItemSchedule;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/** The wording of the lifecycle messages (plan 07). Pure, so the texts are tested. */
public final class LifecycleMessages {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM");

    private LifecycleMessages() {}

    /** What the class gives the family to prepare: gather time, place, online link, things to bring. Blank parts are left out. */
    public static List<String> classDetails(ItemSchedule schedule) {
        List<String> parts = new ArrayList<>();
        if (schedule == null) return parts;
        add(parts, "Giờ tập trung", schedule.getGatherTime());
        add(parts, "Địa điểm", schedule.getLocationNote());
        add(parts, "Học online", schedule.getMeetingUrl());
        add(parts, "Mang theo", schedule.getBringItems());
        return parts;
    }

    /** The same details in one text for emails (one line per part). */
    public static String classInfo(String itemTitle, ItemSchedule schedule) {
        List<String> parts = classDetails(schedule);
        String head = "• " + itemTitle;
        return parts.isEmpty() ? head : head + "\n" + String.join("\n", parts.stream().map(part -> "   " + part).toList());
    }

    public static String startTitle(long daysUntil) {
        return daysUntil <= 0 ? "Hôm nay khai giảng" : daysUntil == 1 ? "Ngày mai khai giảng" : "Sắp khai giảng";
    }

    public static String startContent(String learner, String itemTitle, LocalDate firstDay, String time, long daysUntil, ItemSchedule schedule) {
        String when = daysUntil <= 0 ? "hôm nay" : daysUntil == 1 ? "ngày mai" : "sau " + daysUntil + " ngày";
        StringBuilder text = new StringBuilder("%s sắp học %s: buổi đầu %s (%s%s)."
                .formatted(learner, itemTitle, when, firstDay.format(DAY), time == null ? "" : ", " + time));
        classDetails(schedule).forEach(part -> text.append(' ').append(part).append('.'));
        return text.toString();
    }

    public static String absentContent(String learner, String itemTitle, int misses) {
        return "%s đã vắng %d buổi liền ở %s. Nếu bé bận, bạn xin nghỉ hoặc đổi lịch để không bị lỡ bài →"
                .formatted(learner, misses, itemTitle);
    }

    public static String surveyContent(String learner, String itemTitle) {
        return "%s đã học được nửa khóa %s. Bé học có vui không? Chấm 1–5 sao chỉ mất vài giây →".formatted(learner, itemTitle);
    }

    public static String feeContent(String itemTitle, String learner, String paidUntilText, String nextPeriod, long daysLeft) {
        String when = daysLeft <= 0 ? "hết hạn hôm nay" : daysLeft == 1 ? "hết hạn ngày mai" : "còn " + daysLeft + " ngày";
        return "%s của %s: đã đóng %s (%s). Đóng %s để học liên tục →".formatted(itemTitle, learner, paidUntilText, when, nextPeriod);
    }

    public static String bonusSuffix(int bonusPoints) {
        return bonusPoints > 0 ? " Gia hạn trước khi hết khóa nhận thêm " + bonusPoints + " anyPoint." : "";
    }

    private static void add(List<String> parts, String label, String value) {
        if (value != null && !value.isBlank()) parts.add(label + ": " + value.trim());
    }
}
