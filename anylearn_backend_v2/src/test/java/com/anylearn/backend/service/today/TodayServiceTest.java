package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.SessionView;
import com.anylearn.backend.dto.today.TodayResponse;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemScheduleRepository;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.repository.UserLocationRepository;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TodayServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TUESDAY = TodayTestData.TUESDAY;
    private static final long PARENT_ID = 1L;
    private static final long CHILD_ID = 2L;

    private final UserRepository users = mock(UserRepository.class);
    private final UserCourseEnrollmentRepository enrollments = mock(UserCourseEnrollmentRepository.class);
    private final ItemRepository items = mock(ItemRepository.class);
    private final ItemScheduleRepository schedules = mock(ItemScheduleRepository.class);
    private final OrderDetailRepository orderDetails = mock(OrderDetailRepository.class);
    private final UserLocationRepository locations = mock(UserLocationRepository.class);
    private final SessionAttendanceRepository attendances = mock(SessionAttendanceRepository.class);
    private final ScheduleRequestRepository requests = mock(ScheduleRequestRepository.class);

    private User parent;

    @BeforeEach
    void setUpChildWithOnsiteClassAndOnlineClassOnTuesday() {
        parent = TodayTestData.user(PARENT_ID, "Mẹ");
        User child = TodayTestData.user(CHILD_ID, "Bin");
        User teacher = TodayTestData.user(9L, "Cô Lan");
        when(users.findByUserIdAndIsChild(PARENT_ID, (byte) 1)).thenReturn(List.of(child));
        when(users.findAllById(anyIterable())).thenReturn(List.of(teacher));

        var onsite = TodayTestData.item(10L, "Tiếng Anh", "offline");
        var online = TodayTestData.item(11L, "Kỹ năng sống", "online");
        when(items.findAllById(anyIterable())).thenReturn(List.of(onsite, online));
        when(schedules.findAllById(anyIterable())).thenReturn(List.of(
                TodayTestData.schedule(100L, 10L, "tue,thu", "17:30", "19:00"),
                TodayTestData.schedule(101L, 11L, "tue", "19:45", "21:00")));
        when(enrollments.findByUserIdAndStatus(CHILD_ID, "active")).thenReturn(List.of(
                TodayTestData.enrollment(1L, CHILD_ID, 10L, 100L), TodayTestData.enrollment(2L, CHILD_ID, 11L, 101L)));
        when(enrollments.findByUserIdAndStatus(PARENT_ID, "active")).thenReturn(List.of());
        when(orderDetails.findItemIdsWithPendingPayment(anyLong())).thenReturn(List.of());
        when(locations.findAllById(anyIterable())).thenReturn(List.of());
        when(attendances.findByLearnerIdAndSessionDateBetween(anyLong(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
    }

    @Test
    void defaultsToFirstLearnerThatHasEnrollment() {
        var learners = serviceAt(TUESDAY.atTime(16, 10)).learners(parent);

        assertThat(learners.learners()).extracting(l -> l.name()).containsExactly("Mẹ", "Bin");
        assertThat(learners.defaultLearnerId()).isEqualTo(CHILD_ID);
    }

    @Test
    void beforeFirstClassNextIsOnsiteAndTheOnlineClassIsLaterToday() {
        TodayResponse today = serviceAt(TUESDAY.atTime(16, 10)).today(parent, null);

        assertThat(today.nextSession().title()).isEqualTo("Tiếng Anh");
        assertThat(today.nextSession().mode()).isEqualTo(SessionMode.ONSITE);
        assertThat(today.freeToday()).isFalse();
        assertThat(today.laterToday()).extracting(SessionView::title).containsExactly("Kỹ năng sống");
        assertThat(today.laterToday().get(0).canJoin()).isFalse();
        assertThat(today.laterToday().get(0).joinOpensAt()).isEqualTo(TUESDAY.atTime(19, 30));
    }

    @Test
    void onlineClassOpensFifteenMinutesBeforeStart() {
        TodayResponse today = serviceAt(TUESDAY.atTime(19, 30)).today(parent, null);

        assertThat(today.nextSession().title()).isEqualTo("Kỹ năng sống");
        assertThat(today.nextSession().canJoin()).isTrue();
    }

    @Test
    void afterAllClassesTodayNextIsThursdayAndTodayIsFree() {
        TodayResponse today = serviceAt(TUESDAY.atTime(22, 0)).today(parent, null);

        assertThat(today.nextSession().startAt()).isEqualTo(TUESDAY.plusDays(2).atTime(17, 30));
        assertThat(today.freeToday()).isTrue();
        assertThat(today.laterToday()).isEmpty();
    }

    @Test
    void weekStripMarksClassDaysFromMondayToSunday() {
        TodayResponse today = serviceAt(TUESDAY.atTime(8, 0)).today(parent, null);

        assertThat(today.week()).hasSize(7);
        assertThat(today.week().get(0).date()).isEqualTo(TUESDAY.minusDays(1));
        assertThat(today.week()).extracting(day -> day.hasClass())
                .containsExactly(false, true, false, true, false, false, false);
    }

    @Test
    void approvedLeaveHidesThatSessionFromNextAndWeek() {
        ScheduleRequest leave = request(100L, TUESDAY, ScheduleRequest.TYPE_LEAVE, ScheduleRequest.STATUS_APPROVED);
        when(requests.findByLearnerIdAndTypeAndStatus(CHILD_ID, ScheduleRequest.TYPE_LEAVE, ScheduleRequest.STATUS_APPROVED))
                .thenReturn(List.of(leave));

        TodayResponse today = serviceAt(TUESDAY.atTime(16, 10)).today(parent, null);

        assertThat(today.nextSession().title()).isEqualTo("Kỹ năng sống");
        assertThat(today.week().get(1).sessions()).extracting(SessionView::title).containsExactly("Kỹ năng sống");
    }

    @Test
    void pendingRequestIsShownOnItsSession() {
        ScheduleRequest pending = request(100L, TUESDAY, ScheduleRequest.TYPE_RESCHEDULE, ScheduleRequest.STATUS_PENDING);
        when(requests.findByLearnerIdAndStatus(CHILD_ID, ScheduleRequest.STATUS_PENDING)).thenReturn(List.of(pending));

        TodayResponse today = serviceAt(TUESDAY.atTime(16, 10)).today(parent, null);

        assertThat(today.nextSession().pendingRequest()).isEqualTo("reschedule");
        assertThat(today.laterToday().get(0).pendingRequest()).isNull();
    }

    @Test
    void rejectsLearnerThatBelongsToSomeoneElse() {
        var service = serviceAt(TUESDAY.atTime(8, 0));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.today(parent, 999L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private TodayService serviceAt(LocalDateTime moment) {
        Clock clock = Clock.fixed(moment.atZone(ZONE).toInstant(), ZONE);
        SessionSchedule schedule = new SessionSchedule();
        return new TodayService(
                new LearnerLoader(users, enrollments, items, schedules, orderDetails),
                schedule,
                new SessionViews(users, locations, attendances, requests, schedule),
                requests,
                new FeeCards(),
                new PackageCards(schedule),
                clock);
    }

    private ScheduleRequest request(long scheduleId, LocalDate date, String type, String status) {
        ScheduleRequest request = new ScheduleRequest();
        request.setLearnerId(CHILD_ID);
        request.setItemScheduleId(scheduleId);
        request.setSessionDate(date);
        request.setType(type);
        request.setStatus(status);
        return request;
    }
}
