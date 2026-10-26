package com.anylearn.backend.service;

import com.anylearn.backend.entity.AdminNotificationRecipient;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.AdminNotificationRecipientRepository;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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

class AdminRecipientsServiceTest {

    private AdminNotificationRecipientRepository recipients;
    private UserRepository users;
    private NotificationService notifications;
    private AdminRecipientsService service;

    @BeforeEach
    void setUp() {
        recipients = mock(AdminNotificationRecipientRepository.class);
        users = mock(UserRepository.class);
        notifications = mock(NotificationService.class);
        service = new AdminRecipientsService(recipients, users, notifications);
    }

    private static User member(long id, String role, int status, int isChild) {
        User user = new User();
        user.setId(id);
        user.setName("User " + id);
        user.setPhone("09000000" + id);
        user.setRole(role);
        user.setStatus((byte) status);
        user.setIsChild((byte) isChild);
        return user;
    }

    private static AdminNotificationRecipient row(long userId) {
        AdminNotificationRecipient row = new AdminNotificationRecipient();
        row.setUserId(userId);
        return row;
    }

    @Test
    void addsNewMembersAndDropsTheOnesRemoved() {
        when(recipients.findAll()).thenReturn(List.of(row(10), row(11)));
        when(users.findAllById(any())).thenReturn(List.of(member(11, "member", 1, 0), member(12, "member", 1, 0)));

        String problem = service.save(List.of(11L, 12L, 12L), 1L);

        assertThat(problem).isNull();
        verify(recipients).deleteAllById(List.of(10L));
        ArgumentCaptor<AdminNotificationRecipient> added = ArgumentCaptor.forClass(AdminNotificationRecipient.class);
        verify(recipients, times(1)).save(added.capture());
        assertThat(added.getValue().getUserId()).isEqualTo(12L);
        assertThat(added.getValue().getAddedBy()).isEqualTo(1L);
        assertThat(added.getValue().getCreatedAt()).isNotNull();
    }

    @Test
    void anEmptyListClearsEveryone() {
        when(recipients.findAll()).thenReturn(List.of(row(10)));
        when(users.findAllById(any())).thenReturn(List.of());

        assertThat(service.save(List.of(), 1L)).isNull();
        assertThat(service.save(null, 1L)).isNull();

        verify(recipients, times(2)).deleteAllById(List.of(10L));
        verify(recipients, never()).save(any());
    }

    @Test
    void refusesWhatCannotReceiveAdminNews() {
        when(recipients.findAll()).thenReturn(List.of());

        when(users.findAllById(any())).thenReturn(List.of(member(5, "member", 1, 1)));
        assertThat(service.save(List.of(5L), 1L)).contains("bé");

        when(users.findAllById(any())).thenReturn(List.of(member(6, "admin", 1, 0)));
        assertThat(service.save(List.of(6L), 1L)).contains("đã là quản trị viên");

        when(users.findAllById(any())).thenReturn(List.of(member(7, "member", 0, 0)));
        assertThat(service.save(List.of(7L), 1L)).contains("khoá");

        verify(recipients, never()).save(any());
        verify(recipients, never()).deleteAllById(any());
    }

    @Test
    void refusesUnknownMembersAndTooLongLists() {
        when(users.findAllById(any())).thenReturn(List.of());
        assertThat(service.save(List.of(99L), 1L)).contains("không tồn tại");

        List<Long> tooMany = java.util.stream.LongStream.rangeClosed(1, AdminRecipientsService.MAX_EXTRA_RECIPIENTS + 1).boxed().toList();
        assertThat(service.save(tooMany, 1L)).contains("Tối đa");
        verify(recipients, never()).save(any());
    }

    @Test
    void sendsOneTestToEveryRecipientEvenIfOneFails() {
        when(users.findAdminNotificationRecipients()).thenReturn(List.of(member(1, "admin", 1, 0), member(12, "member", 1, 0)));
        doThrow(new RuntimeException("push down")).when(notifications)
                .createNotification(eq(1L), anyString(), anyString(), anyString(), any(), any());

        int sent = service.sendTest();

        assertThat(sent).isEqualTo(1);
        verify(notifications).createNotification(eq(12L), eq("system_notif"), anyString(), anyString(), any(), any());
    }

    @Test
    void viewListsAdminsAndTheAddedMembers() {
        when(users.findByRole("admin")).thenReturn(List.of(member(1, "admin", 1, 0)));
        when(recipients.findAll()).thenReturn(List.of(row(12)));
        when(users.findAllById(any())).thenReturn(List.of(member(12, "member", 1, 0)));

        var view = service.view();

        assertThat(view.get("max")).isEqualTo(50);
        assertThat((List<?>) view.get("admins")).hasSize(1);
        assertThat((List<?>) view.get("extras")).hasSize(1);
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), any(), any());
    }
}
