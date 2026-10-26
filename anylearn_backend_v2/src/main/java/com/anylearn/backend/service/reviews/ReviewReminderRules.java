package com.anylearn.backend.service.reviews;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

/**
 * Pure rules of the "write a review" reminders. Two steps per course: "mid" when half of the course has passed,
 * "end" when it is over. A course without an end date counts as over {@link #OPEN_COURSE_DAYS} days after the start.
 */
public final class ReviewReminderRules {

    public static final String MID = "mid";
    public static final String END = "end";
    public static final int OPEN_COURSE_DAYS = 30;
    /** Reminders stop this long after the course ended, so the first run on old data does not message everyone. */
    public static final int WINDOW_DAYS = 14;

    private ReviewReminderRules() {}

    public static LocalDate endOf(LocalDate start, LocalDate end) {
        if (end != null) return end;
        return start == null ? null : start.plusDays(OPEN_COURSE_DAYS);
    }

    /** The step to send today, or empty. After downtime only the latest due step goes out. */
    public static Optional<String> dueStage(LocalDate start, LocalDate end, LocalDate today, Set<String> sent) {
        LocalDate over = endOf(start, end);
        if (start == null || over == null) return Optional.empty();
        if (today.isAfter(over.plusDays(WINDOW_DAYS))) return Optional.empty();
        if (!today.isBefore(over)) return sent.contains(END) ? Optional.empty() : Optional.of(END);
        long length = ChronoUnit.DAYS.between(start, over);
        boolean halfway = length >= 2 && !today.isBefore(start.plusDays(length / 2));
        return halfway && !sent.contains(MID) && !sent.contains(END) ? Optional.of(MID) : Optional.empty();
    }

    public static String title(String stage) {
        return MID.equals(stage) ? "Bé học thế nào rồi?" : "Khóa học đã kết thúc, bạn thấy sao?";
    }

    public static String content(String stage, String courseTitle, int rewardPoints) {
        String reward = rewardPoints > 0 ? " Viết đánh giá nhận " + rewardPoints + " anyPoint." : "";
        return (MID.equals(stage)
                ? "Bé đã học được nửa khóa " + courseTitle + ". Chia sẻ cảm nhận để các phụ huynh khác tham khảo."
                : "Chia sẻ cảm nhận về khóa " + courseTitle + " để giúp các phụ huynh khác chọn lớp.") + reward;
    }
}
