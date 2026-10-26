package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.JoinResponse;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.SessionAttendance;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemScheduleRepository;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static com.anylearn.backend.service.today.TodayTestData.TUESDAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TodayActionsTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long PARENT_ID = 1L;
    private static final long CHILD_ID = 2L;
    private static final String ONLINE_KEY = "101_20261013";
    private static final String ONSITE_KEY = "100_20261013";

    private final UserRepository users = mock(UserRepository.class);
    private final SessionAttendanceRepository attendances = mock(SessionAttendanceRepository.class);
    private final ScheduleRequestRepository requests = mock(ScheduleRequestRepository.class);
    private final NotificationService notifications = mock(NotificationService.class);

    private User parent;

    @BeforeEach
    void setUpChildWithOnsiteAndOnlineClassOnTuesday() {
        parent = TodayTestData.user(PARENT_ID, "Mẹ");
        when(users.findByUserIdAndIsChild(PARENT_ID, (byte) 1)).thenReturn(List.of(TodayTestData.user(CHILD_ID, "Bin")));
        when(users.findAdminNotificationRecipients()).thenReturn(List.of(TodayTestData.user(50L, "Admin")));
    }

    @Test
    void joinBeforeTheWindowOpensIsRejectedAndNotRecorded() {
        var actions = actionsAt(TUESDAY.atTime(19, 29));

        assertThatThrownBy(() -> actions.join(parent, CHILD_ID, ONLINE_KEY))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Chưa đến giờ vào lớp");
        verify(attendances, never()).save(any());
    }

    @Test
    void joinInsideTheWindowReturnsLinkAndRecordsAttendance() {
        var actions = actionsAt(TUESDAY.atTime(19, 30));

        JoinResponse response = actions.join(parent, CHILD_ID, ONLINE_KEY);

        assertThat(response.url()).isEqualTo("https://zoom.us/j/1");
        assertThat(response.passcode()).isEqualTo("pass");
        SessionAttendance saved = savedAttendance();
        assertThat(saved.getLearnerId()).isEqualTo(CHILD_ID);
        assertThat(saved.getSource()).isEqualTo(SessionAttendance.SOURCE_JOIN);
        assertThat(saved.getJoinedAt()).isEqualTo(TUESDAY.atTime(19, 30));
    }

    @Test
    void joinIsRejectedForOnsiteClass() {
        var actions = actionsAt(TUESDAY.atTime(17, 30));

        assertThatThrownBy(() -> actions.join(parent, CHILD_ID, ONSITE_KEY))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Buổi học này không học online");
    }

    @Test
    void joinIsRejectedForSessionTheLearnerIsNotEnrolledIn() {
        var actions = actionsAt(TUESDAY.atTime(19, 30));

        assertThatThrownBy(() -> actions.join(parent, CHILD_ID, "999_20261013"))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Không tìm thấy buổi học");
    }

    @Test
    void joinIsRejectedForLearnerOfAnotherAccount() {
        var actions = actionsAt(TUESDAY.atTime(19, 30));

        assertThatThrownBy(() -> actions.join(parent, 777L, ONLINE_KEY))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Không tìm thấy người học");
    }

    @Test
    void markAttendedBeforeStartIsRejected() {
        var actions = actionsAt(TUESDAY.atTime(17, 29));

        assertThatThrownBy(() -> actions.markAttended(parent, CHILD_ID, ONSITE_KEY))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Buổi học chưa bắt đầu");
    }

    @Test
    void markAttendedAfterStartIsRecordedAsManual() {
        actionsAt(TUESDAY.atTime(17, 45)).markAttended(parent, CHILD_ID, ONSITE_KEY);

        assertThat(savedAttendance().getSource()).isEqualTo(SessionAttendance.SOURCE_MANUAL);
    }

    @Test
    void markAttendedTwiceKeepsOneRecord() {
        SessionAttendance existing = new SessionAttendance();
        existing.setSource(SessionAttendance.SOURCE_MANUAL);
        when(attendances.findByLearnerIdAndItemScheduleIdAndSessionDate(CHILD_ID, 100L, TUESDAY))
                .thenReturn(Optional.of(existing));

        actionsAt(TUESDAY.atTime(18, 0)).markAttended(parent, CHILD_ID, ONSITE_KEY);

        assertThat(savedAttendance()).isSameAs(existing);
    }

    @Test
    void requestChangeSavesPendingRequestAndNotifiesAdmin() {
        when(requests.save(any(ScheduleRequest.class))).thenAnswer(call -> {
            ScheduleRequest saved = call.getArgument(0);
            saved.setId(7L);
            return saved;
        });

        var response = actionsAt(TUESDAY.atTime(10, 0))
                .requestChange(parent, CHILD_ID, ONSITE_KEY, ScheduleRequest.TYPE_LEAVE, "Bé ốm");

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.status()).isEqualTo(ScheduleRequest.STATUS_PENDING);
        ArgumentCaptor<ScheduleRequest> captor = ArgumentCaptor.forClass(ScheduleRequest.class);
        verify(requests).save(captor.capture());
        assertThat(captor.getValue().getAccountId()).isEqualTo(PARENT_ID);
        assertThat(captor.getValue().getLearnerId()).isEqualTo(CHILD_ID);
        assertThat(captor.getValue().getEnrollmentId()).isEqualTo(1L);
        verify(notifications).createNotification(eq(50L), eq("system_notif"), anyString(),
                org.mockito.ArgumentMatchers.contains("xin nghỉ cho Bin"), anyString(), any());
    }

    @Test
    void requestChangeRejectsUnknownTypeEndedSessionAndDuplicate() {
        var actions = actionsAt(TUESDAY.atTime(10, 0));

        assertThatThrownBy(() -> actions.requestChange(parent, CHILD_ID, ONSITE_KEY, "cancel", null))
                .hasMessage("Loại yêu cầu không hợp lệ");
        assertThatThrownBy(() -> actionsAt(TUESDAY.atTime(19, 0))
                .requestChange(parent, CHILD_ID, ONSITE_KEY, ScheduleRequest.TYPE_LEAVE, null))
                .hasMessage("Buổi học đã kết thúc");

        when(requests.existsByLearnerIdAndItemScheduleIdAndSessionDateAndStatus(
                CHILD_ID, 100L, TUESDAY, ScheduleRequest.STATUS_PENDING)).thenReturn(true);
        assertThatThrownBy(() -> actions.requestChange(parent, CHILD_ID, ONSITE_KEY, ScheduleRequest.TYPE_LEAVE, null))
                .hasMessage("Bạn đã gửi yêu cầu cho buổi này, anyLEARN sẽ phản hồi sớm");
        verify(requests, never()).save(any());
    }

    private SessionAttendance savedAttendance() {
        ArgumentCaptor<SessionAttendance> captor = ArgumentCaptor.forClass(SessionAttendance.class);
        verify(attendances).save(captor.capture());
        return captor.getValue();
    }

    private TodayActions actionsAt(LocalDateTime moment) {
        UserCourseEnrollmentRepository enrollments = mock(UserCourseEnrollmentRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        ItemScheduleRepository schedules = mock(ItemScheduleRepository.class);
        OrderDetailRepository orderDetails = mock(OrderDetailRepository.class);

        when(items.findAllById(anyIterable())).thenReturn(List.of(
                TodayTestData.item(10L, "Tiếng Anh", "offline"), TodayTestData.item(11L, "Kỹ năng sống", "online")));
        when(schedules.findAllById(anyIterable())).thenReturn(List.of(
                TodayTestData.schedule(100L, 10L, "tue", "17:30", "19:00"),
                TodayTestData.withMeeting(TodayTestData.schedule(101L, 11L, "tue", "19:45", "21:00"), "https://zoom.us/j/1")));
        when(enrollments.findByUserIdAndStatus(CHILD_ID, "active")).thenReturn(List.of(
                TodayTestData.enrollment(1L, CHILD_ID, 10L, 100L), TodayTestData.enrollment(2L, CHILD_ID, 11L, 101L)));
        when(orderDetails.findItemIdsWithPendingPayment(anyLong())).thenReturn(List.of());

        Clock clock = Clock.fixed(moment.atZone(ZONE).toInstant(), ZONE);
        return new TodayActions(new LearnerLoader(users, enrollments, items, schedules, orderDetails),
                new SessionSchedule(), attendances, requests, users, notifications, clock);
    }
}
