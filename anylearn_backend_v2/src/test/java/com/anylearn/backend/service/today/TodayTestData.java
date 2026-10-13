package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.entity.UserCourseEnrollment;

import java.time.LocalDate;

final class TodayTestData {

    static final LocalDate TUESDAY = LocalDate.of(2026, 10, 13);

    private TodayTestData() {
    }

    static User user(long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    static Item item(long id, String title, String subtype) {
        Item item = new Item();
        item.setId(id);
        item.setTitle(title);
        item.setSubtype(subtype);
        item.setUserId(9L);
        return item;
    }

    static ItemSchedule schedule(long id, long itemId, String weekdays, String start, String end) {
        ItemSchedule schedule = new ItemSchedule();
        schedule.setId(id);
        schedule.setItemId(itemId);
        schedule.setScheduleType("recurring");
        schedule.setWeekdays(weekdays);
        schedule.setTimeStart(start);
        schedule.setTimeEnd(end);
        return schedule;
    }

    static ItemSchedule withMeeting(ItemSchedule schedule, String url) {
        schedule.setMeetingUrl(url);
        schedule.setMeetingId("123 456");
        schedule.setMeetingPasscode("pass");
        return schedule;
    }

    static UserCourseEnrollment enrollment(long id, long learnerId, long itemId, long scheduleId) {
        UserCourseEnrollment enrollment = new UserCourseEnrollment();
        enrollment.setId(id);
        enrollment.setUserId(learnerId);
        enrollment.setItemId(itemId);
        enrollment.setScheduleId(scheduleId);
        enrollment.setStartDate(TUESDAY.minusDays(30));
        enrollment.setEndDate(TUESDAY.plusDays(60));
        enrollment.setStatus("active");
        return enrollment;
    }

    static User child(long id, String name, long parentId) {
        User child = user(id, name);
        child.setIsChild((byte) 1);
        child.setUserId(parentId);
        return child;
    }

    static Item sessionItem(long id, int purchasedSessions) {
        Item item = item(id, "Tiếng Anh", "offline");
        item.setCycleType("session");
        item.setCycleAmount(purchasedSessions);
        return item;
    }

    static Item feeItem(long id) {
        Item item = item(id, "Học phí lớp 3A", "offline");
        item.setIsPaymentfee(1);
        item.setCycleType("month");
        item.setCycleAmount(1);
        return item;
    }

    static UserCourseEnrollment enrollment(long id, long learnerId, long itemId, Long scheduleId,
                                           LocalDate start, LocalDate end) {
        UserCourseEnrollment enrollment = enrollment(id, learnerId, itemId, scheduleId == null ? 0L : scheduleId);
        enrollment.setScheduleId(scheduleId);
        enrollment.setStartDate(start);
        enrollment.setEndDate(end);
        return enrollment;
    }
}
