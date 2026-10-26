package com.anylearn.backend.service.partners;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/** Members follow partners and are told when a new course of that partner opens (plan 04.5). */
@Service
@RequiredArgsConstructor
@Slf4j
public class FollowService {

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** Adds a follow. Returns false when the partner does not exist or is the person themselves. */
    public boolean follow(Long userId, Long partnerId) {
        if (userId.equals(partnerId) || !userRepository.existsById(partnerId)) return false;
        jdbc.update("INSERT IGNORE INTO follows (user_id, partner_id) VALUES (?, ?)", userId, partnerId);
        return true;
    }

    public void unfollow(Long userId, Long partnerId) {
        jdbc.update("DELETE FROM follows WHERE user_id = ? AND partner_id = ?", userId, partnerId);
    }

    public boolean isFollowing(Long userId, Long partnerId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM follows WHERE user_id = ? AND partner_id = ?", Integer.class, userId, partnerId);
        return count != null && count > 0;
    }

    public long countFollowers(Long partnerId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM follows WHERE partner_id = ?", Long.class, partnerId);
        return count == null ? 0 : count;
    }

    public static boolean isLive(Item item) {
        return item.getStatus() != null && item.getStatus() == 1 && item.getUserStatus() != null && item.getUserStatus() == 1;
    }

    /**
     * Call after a course was saved. Only a course that just became open (it was not before) is announced, and only once
     * per course. Followers get an in-app notification and a push.
     */
    public void announceIfNewlyOpen(Item item, boolean wasLive) {
        if (wasLive || !isLive(item)) return;
        int firstTime = jdbc.update("INSERT IGNORE INTO follow_announcements (item_id) VALUES (?)", item.getId());
        if (firstTime == 0) return;
        List<Long> followers = jdbc.queryForList("SELECT user_id FROM follows WHERE partner_id = ?", Long.class, item.getUserId());
        if (followers.isEmpty()) return;
        String partnerName = userRepository.findById(item.getUserId()).map(user -> user.getName()).orElse("Đối tác bạn theo dõi");
        for (Long follower : followers) {
            try {
                notificationService.createNotification(follower, "new_course", partnerName + " vừa mở khóa mới",
                        item.getTitle(), "/pdp", String.valueOf(item.getId()));
            } catch (RuntimeException e) {
                log.warn("Could not tell follower {} about item {}: {}", follower, item.getId(), e.getMessage());
            }
        }
    }
}
