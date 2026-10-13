package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.entity.UserCourseEnrollment;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.ScheduleNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduleNotificationServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TUESDAY = LocalDate.of(2026, 10, 13);
    private static final long PARENT_ID = 1L;
    private static final long CHILD_ID = 2L;
    private static final String ROUTE = "/today?child=2";

    private final UserCourseEnrollmentRepository enrollments = mock(UserCourseEnrollmentRepository.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final LearnerLoader loader = mock(LearnerLoader.class);

    private ScheduleNotificationService job;

    @BeforeEach
    void setUp() {
        User child = TodayTestData.child(CHILD_ID, "Bin", PARENT_ID);
        when(users.findById(CHILD_ID)).thenReturn(Optional.of(child));
        when(enrollments.findActiveLearnerIds()).thenReturn(List.of(CHILD_ID));
        Clock clock = Clock.fixed(TUESDAY.atTime(22, 0).atZone(ZONE).toInstant(), ZONE);
        job = new ScheduleNotificationService(enrollments, notifications, users, loader,
                new PackageCards(new SessionSchedule()), new FeeCards(), clock);
    }

    @Test
    void remindsParentWhenThreeOrFewerSessionsAreLeft() {
        when(loader.load(CHILD_ID)).thenReturn(new LearnerData(List.of(sessionPackage(4, 1L)), List.of()));

        job.scan();

        verify(notifications).createScheduledNotification(eq(PARENT_ID), eq("schedule_renewal"),
                eq("Sắp hết buổi học"), contains("Bin còn 1 buổi"), eq(ROUTE), eq("renew-sessions:1"), any());
    }

    @Test
    void doesNotRemindWhileManySessionsRemain() {
        when(loader.load(CHILD_ID)).thenReturn(new LearnerData(List.of(sessionPackage(12, 1L)), List.of()));

        job.scan();

        verify(notifications, never()).createScheduledNotification(any(), eq("schedule_renewal"), any(), any(), any(),
                eq("renew-sessions:1"), any());
    }

    @Test
    void remindsFeeDueSoonWithGentleWording() {
        when(loader.load(CHILD_ID)).thenReturn(new LearnerData(List.of(feeEnrollment(TUESDAY.plusDays(3))), List.of()));

        job.scan();

        verify(notifications).createScheduledNotification(eq(PARENT_ID), eq("schedule_renewal"),
                eq("Học phí sắp đến hạn"), contains("Đóng Tháng 10 để học liên tục"), eq(ROUTE),
                contains("renew-fee:50:2:2026-10-16:DUE_SOON"), any());
    }

    @Test
    void overdueFeeSaysNotReceivedAndNeverUsesDebtWording() {
        when(loader.load(CHILD_ID)).thenReturn(new LearnerData(List.of(feeEnrollment(TUESDAY.minusDays(3))), List.of()));

        job.scan();

        verify(notifications).createScheduledNotification(eq(PARENT_ID), eq("schedule_renewal"),
                eq("Chưa nhận được học phí"), org.mockito.ArgumentMatchers.argThat(text -> !text.toLowerCase().contains("nợ")),
                eq(ROUTE), contains(":OVERDUE"), any());
    }

    @Test
    void adultLearnerIsRemindedDirectlyAsYou() {
        User adult = TodayTestData.user(CHILD_ID, "Sinh viên");
        when(users.findById(CHILD_ID)).thenReturn(Optional.of(adult));
        when(loader.load(CHILD_ID)).thenReturn(new LearnerData(List.of(sessionPackage(4, 1L)), List.of()));

        job.scan();

        verify(notifications).createScheduledNotification(eq(CHILD_ID), eq("schedule_renewal"),
                eq("Sắp hết buổi học"), contains("Bạn còn 1 buổi"), eq(ROUTE), eq("renew-sessions:1"), any());
    }

    private EnrollmentContext sessionPackage(int purchasedSessions, long enrollmentId) {
        Item item = TodayTestData.sessionItem(10L, purchasedSessions);
        UserCourseEnrollment enrollment = TodayTestData.enrollment(
                enrollmentId, CHILD_ID, 10L, 100L, TUESDAY.minusDays(14), TUESDAY.plusDays(60));
        return new EnrollmentContext(enrollment, item,
                TodayTestData.schedule(100L, 10L, "tue", "17:30", "19:00"));
    }

    private EnrollmentContext feeEnrollment(LocalDate paidUntil) {
        Item item = TodayTestData.feeItem(50L);
        UserCourseEnrollment enrollment = TodayTestData.enrollment(
                9L, CHILD_ID, 50L, null, paidUntil.minusDays(29), paidUntil);
        return new EnrollmentContext(enrollment, item, null);
    }
}
