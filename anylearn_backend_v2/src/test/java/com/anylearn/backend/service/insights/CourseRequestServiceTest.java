package com.anylearn.backend.service.insights;

import com.anylearn.backend.entity.CourseRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.CourseRequestRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CourseRequestServiceTest {

    private CourseRequestRepository requests;
    private UserRepository users;
    private NotificationService notifications;
    private CourseRequestService service;

    @BeforeEach
    void setUp() {
        requests = mock(CourseRequestRepository.class);
        users = mock(UserRepository.class);
        notifications = mock(NotificationService.class);
        service = new CourseRequestService(requests, users, notifications);
        service.setDailyLimit(3);
        User admin = new User();
        admin.setId(1L);
        User otherAdmin = new User();
        otherAdmin.setId(2L);
        when(users.findAdminNotificationRecipients()).thenReturn(List.of(admin, otherAdmin));
    }

    private static CourseRequestInput input() {
        return new CourseRequestInput("Mẹ Bin", "0912345678", "Cờ vua", 9, null, null, null, null, null, null, null);
    }

    @Test
    void savesTheRequestAndTellsEveryAdmin() {
        CourseRequest saved = service.create(input(), null);

        assertThat(saved.getCreatedAt()).isNotNull();
        verify(requests).save(saved);
        verify(notifications, times(2)).createNotification(anyLong(), eq("system_notif"), eq("Yêu cầu tìm khóa học mới"),
                anyString(), eq("/admin/course-requests"), any());
    }

    @Test
    void stopsAPhoneNumberThatSendsTooMany() {
        when(requests.countByContactPhoneAndCreatedAtAfter(eq("0912345678"), any())).thenReturn(3L);

        assertThatThrownBy(() -> service.create(input(), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("nhiều yêu cầu");
        verify(requests, never()).save(any());
    }

    @Test
    void aFailingNotificationDoesNotLoseTheRequest() {
        doThrow(new RuntimeException("push down")).when(notifications)
                .createNotification(eq(1L), anyString(), anyString(), anyString(), anyString(), any());

        service.create(input(), null);

        verify(requests).save(any(CourseRequest.class));
        verify(notifications).createNotification(eq(2L), anyString(), anyString(), anyString(), anyString(), any());
    }
}
