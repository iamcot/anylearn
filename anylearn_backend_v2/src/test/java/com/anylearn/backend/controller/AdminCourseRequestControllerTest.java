package com.anylearn.backend.controller;

import com.anylearn.backend.controller.admin.AdminCourseRequestController;
import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.CourseRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.CourseRequestRepository;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminCourseRequestControllerTest {

    private CourseRequestRepository requests;
    private ItemRepository items;
    private NotificationService notifications;
    private AdminCourseRequestController controller;
    private User admin;
    private CourseRequest request;

    @BeforeEach
    void setUp() {
        requests = mock(CourseRequestRepository.class);
        items = mock(ItemRepository.class);
        notifications = mock(NotificationService.class);
        controller = new AdminCourseRequestController(requests, items, notifications);
        admin = new User();
        admin.setId(1L);
        admin.setRole("admin");
        request = new CourseRequest();
        request.setId(10L);
        request.setUserId(77L);
        request.setSubject("Cờ vua");
        when(requests.findById(10L)).thenReturn(Optional.of(request));
    }

    @Test
    void onlyAdminsMayUseIt() {
        User member = new User();
        member.setRole("member");

        assertThat(controller.list(member, null).message()).isEqualTo("Forbidden");
        assertThat(controller.update(member, 10L, Map.of("status", "closed")).message()).isEqualTo("Forbidden");
        assertThat(controller.update(null, 10L, Map.of("status", "closed")).message()).isEqualTo("Forbidden");
    }

    @Test
    void refusesAnUnknownStatus() {
        ApiResponse<?> response = controller.update(admin, 10L, Map.of("status", "zzz"));

        assertThat(response.resultCode()).isZero();
        verify(requests, never()).save(any());
    }

    @Test
    void matchedNeedsARealCourse() {
        assertThat(controller.update(admin, 10L, Map.of("status", "matched")).resultCode()).isZero();

        when(items.existsById(5L)).thenReturn(false);
        assertThat(controller.update(admin, 10L, Map.of("status", "matched", "matchedItemId", 5)).resultCode()).isZero();
        verify(requests, never()).save(any());
    }

    @Test
    void matchingTellsTheRequesterWhereTheCourseIs() {
        when(items.existsById(5L)).thenReturn(true);

        ApiResponse<?> response = controller.update(admin, 10L, Map.of("status", "matched", "matchedItemId", 5, "adminNote", " đã có lớp "));

        assertThat(response.resultCode()).isEqualTo(1);
        assertThat(request.getStatus()).isEqualTo("matched");
        assertThat(request.getMatchedItemId()).isEqualTo(5L);
        assertThat(request.getAdminNote()).isEqualTo("đã có lớp");
        assertThat(request.getHandledBy()).isEqualTo(1L);
        verify(notifications).createNotification(eq(77L), eq("system_notif"), anyString(), anyString(), eq("/pdp"), eq("5"));
    }

    @Test
    void doesNotNotifyTwiceOrAGuest() {
        when(items.existsById(5L)).thenReturn(true);
        request.setStatus("matched");
        controller.update(admin, 10L, Map.of("status", "matched", "matchedItemId", 5));
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString(), any());

        CourseRequest guest = new CourseRequest();
        guest.setId(11L);
        guest.setSubject("Cờ vua");
        when(requests.findById(11L)).thenReturn(Optional.of(guest));
        controller.update(admin, 11L, Map.of("status", "matched", "matchedItemId", 5));
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void otherStatusesClearTheMatchedCourse() {
        request.setStatus("matched");
        request.setMatchedItemId(5L);

        controller.update(admin, 10L, Map.of("status", "no_partner", "adminNote", "chưa có đối tác"));

        assertThat(request.getStatus()).isEqualTo("no_partner");
        assertThat(request.getMatchedItemId()).isNull();
    }

    @Test
    void unknownRequest() {
        assertThat(controller.update(admin, 99L, Map.of("status", "closed")).resultCode()).isZero();
    }
}
