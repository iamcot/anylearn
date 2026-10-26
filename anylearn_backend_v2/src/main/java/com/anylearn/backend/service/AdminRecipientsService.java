package com.anylearn.backend.service;

import com.anylearn.backend.entity.AdminNotificationRecipient;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.AdminNotificationRecipientRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Who the back office notifies: every user with role "admin", plus members an admin added by hand (a manager, a
 * support person...). They sign in to the app as usual and turn notifications on there; the admin site stays closed to them.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AdminRecipientsService {

    static final int MAX_EXTRA_RECIPIENTS = 50;

    private final AdminNotificationRecipientRepository recipients;
    private final UserRepository users;
    private final NotificationService notifications;

    public Map<String, Object> view() {
        Set<Long> extraIds = new LinkedHashSet<>();
        recipients.findAll().forEach(row -> extraIds.add(row.getUserId()));
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("admins", users.findByRole("admin").stream().map(AdminRecipientsService::describe).toList());
        view.put("extras", users.findAllById(extraIds).stream().map(AdminRecipientsService::describe).toList());
        view.put("max", MAX_EXTRA_RECIPIENTS);
        return view;
    }

    /** Replaces the added members with {@code userIds}. Returns null when saved, otherwise the reason it was refused. */
    @Transactional
    public String save(List<Long> userIds, Long addedBy) {
        Set<Long> wanted = new LinkedHashSet<>(userIds == null ? List.of() : userIds);
        if (wanted.size() > MAX_EXTRA_RECIPIENTS) return "Tối đa " + MAX_EXTRA_RECIPIENTS + " người nhận thông báo";
        List<User> found = users.findAllById(wanted);
        if (found.size() != wanted.size()) return "Có thành viên không tồn tại";
        for (User user : found) {
            String problem = problemWith(user);
            if (problem != null) return problem;
        }

        Set<Long> current = new LinkedHashSet<>();
        recipients.findAll().forEach(row -> current.add(row.getUserId()));
        recipients.deleteAllById(current.stream().filter(id -> !wanted.contains(id)).toList());
        LocalDateTime now = LocalDateTime.now();
        for (Long id : wanted) {
            if (current.contains(id)) continue;
            AdminNotificationRecipient row = new AdminNotificationRecipient();
            row.setUserId(id);
            row.setAddedBy(addedBy);
            row.setCreatedAt(now);
            recipients.save(row);
        }
        return null;
    }

    /** One test notification to everybody on the list, so each person can check their phone. Returns how many were sent. */
    public int sendTest() {
        int sent = 0;
        for (User recipient : users.findAdminNotificationRecipients()) {
            try {
                notifications.createNotification(recipient.getId(), "system_notif", "Thông báo thử từ anyLEARN",
                        "Bạn đang nhận thông báo dành cho quản trị anyLEARN (đơn hàng, chuyển khoản, yêu cầu của khách).", null, null);
                sent++;
            } catch (Exception e) {
                log.warn("[admin-recipients] test not sent to {}: {}", recipient.getId(), e.getMessage());
            }
        }
        return sent;
    }

    private static String problemWith(User user) {
        if (user.getIsChild() != null && user.getIsChild() == 1) return "Tài khoản của bé không nhận được thông báo";
        if ("admin".equals(user.getRole())) return user.getName() + " đã là quản trị viên, không cần thêm";
        if (user.getStatus() == null || user.getStatus() != 1) return user.getName() + " đang bị khoá, không thể thêm";
        return null;
    }

    private static Map<String, Object> describe(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("phone", user.getPhone());
        map.put("role", user.getRole());
        return map;
    }
}
