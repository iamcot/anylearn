package com.anylearn.backend.service.chat;

import com.anylearn.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Back office side of the class chat. */
@Service
@RequiredArgsConstructor
public class ChatAdminService {

    private final JdbcTemplate jdbc;
    private final ChatService chat;

    public List<Map<String, Object>> reports(String status) {
        String filter = status == null || status.isBlank() ? null : status;
        return jdbc.queryForList(
                "SELECT rp.id, rp.status, rp.reason, rp.created_at AS createdAt, rp.message_id AS messageId, "
                        + "m.body, m.is_hidden AS hidden, m.room_id AS roomId, r.title AS roomTitle, m.user_id AS authorId, "
                        + "(SELECT display_name FROM chat_members c WHERE c.room_id = m.room_id AND c.user_id = m.user_id) AS authorName, "
                        + "(SELECT u.name FROM users u WHERE u.id = m.user_id) AS authorAccount, "
                        + "(SELECT c.banned FROM chat_members c WHERE c.room_id = m.room_id AND c.user_id = m.user_id) AS authorBanned, "
                        + "(SELECT display_name FROM chat_members c WHERE c.room_id = m.room_id AND c.user_id = rp.reporter_id) AS reporterName "
                        + "FROM chat_reports rp JOIN chat_messages m ON m.id = rp.message_id JOIN chat_rooms r ON r.id = m.room_id "
                        + "WHERE (? IS NULL OR rp.status = ?) ORDER BY rp.status = 'open' DESC, rp.id DESC LIMIT 300", filter, filter);
    }

    public void handleReport(User admin, long id, String action, boolean ban, int muteDays) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT rp.message_id, m.user_id FROM chat_reports rp JOIN chat_messages m ON m.id = rp.message_id WHERE rp.id = ?", id);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy báo cáo");
        long messageId = ((Number) rows.get(0).get("message_id")).longValue();
        long authorId = ((Number) rows.get(0).get("user_id")).longValue();
        switch (action) {
            case "hide" -> chat.setHidden(admin, messageId, true);
            case "dismiss" -> jdbc.update("UPDATE chat_reports SET status = 'dismissed', handled_by = ?, handled_at = NOW() WHERE message_id = ? AND status = 'open'",
                    admin.getId(), messageId);
            default -> throw new IllegalArgumentException("Hành động không hợp lệ");
        }
        if (ban) setBanned(authorId, true);
        else if (muteDays > 0) mute(authorId, muteDays);
    }

    public void mute(long userId, int days) {
        jdbc.update("UPDATE chat_members SET muted_until = ? WHERE user_id = ?", Timestamp.valueOf(LocalDateTime.now().plusDays(Math.min(days, 365))), userId);
    }

    public void setBanned(long userId, boolean banned) {
        jdbc.update("UPDATE chat_members SET banned = ?, muted_until = NULL WHERE user_id = ?", banned ? 1 : 0, userId);
    }

    public List<Map<String, Object>> banned() {
        return jdbc.queryForList("SELECT u.id AS userId, u.name, MAX(m.joined_at) AS since FROM chat_members m JOIN users u ON u.id = m.user_id "
                + "WHERE m.banned = 1 GROUP BY u.id, u.name ORDER BY u.name");
    }

    public List<Map<String, Object>> rooms(String q) {
        String like = q == null || q.isBlank() ? null : "%" + q.trim() + "%";
        return jdbc.queryForList(
                "SELECT r.id, r.title, r.is_locked AS locked, r.item_id AS itemId, "
                        + "(SELECT COUNT(*) FROM chat_members m WHERE m.room_id = r.id AND m.left_at IS NULL) AS members, "
                        + "(SELECT COUNT(*) FROM chat_messages x WHERE x.room_id = r.id) AS messages, "
                        + "(SELECT MAX(x.created_at) FROM chat_messages x WHERE x.room_id = r.id) AS lastAt "
                        + "FROM chat_rooms r WHERE (? IS NULL OR r.title LIKE ?) ORDER BY lastAt IS NULL, lastAt DESC, r.id DESC LIMIT 300", like, like);
    }

    public void lockRoom(long id, boolean locked) {
        jdbc.update("UPDATE chat_rooms SET is_locked = ? WHERE id = ?", locked ? 1 : 0, id);
    }

    public List<Map<String, Object>> recentMessages(long roomId) {
        return jdbc.queryForList(
                "SELECT x.id, x.body, x.type, x.is_hidden AS hidden, x.created_at AS createdAt, x.user_id AS authorId, "
                        + "(SELECT display_name FROM chat_members c WHERE c.room_id = x.room_id AND c.user_id = x.user_id) AS authorName "
                        + "FROM chat_messages x WHERE x.room_id = ? ORDER BY x.id DESC LIMIT 100", roomId);
    }

    public void setHidden(User admin, long messageId, boolean hidden) {
        chat.setHidden(admin, messageId, hidden);
    }

    public List<Map<String, Object>> members(long roomId) {
        return jdbc.queryForList(
                "SELECT m.user_id AS userId, m.role, m.display_name AS displayName, m.banned, m.muted_until AS mutedUntil, m.left_at AS leftAt, u.name AS account "
                        + "FROM chat_members m JOIN users u ON u.id = m.user_id WHERE m.room_id = ? ORDER BY m.role, m.joined_at", roomId);
    }

    /** A teacher or supporter added by hand: a moderator is never removed by the nightly sync. */
    public void addMember(long roomId, long userId, String role) {
        if (!ChatRules.ROLE_MEMBER.equals(role) && !ChatRules.ROLE_MODERATOR.equals(role)) throw new IllegalArgumentException("Vai trò không hợp lệ");
        if (jdbc.queryForObject("SELECT COUNT(*) FROM chat_rooms WHERE id = ?", Integer.class, roomId) == 0) throw new IllegalArgumentException("Không tìm thấy nhóm");
        List<String> names = jdbc.queryForList("SELECT name FROM users WHERE id = ?", String.class, userId);
        if (names.isEmpty()) throw new IllegalArgumentException("Không tìm thấy người dùng");
        String name = names.get(0) == null ? "Giáo viên" : names.get(0);
        if (name.length() > ChatRules.MAX_NAME) name = name.substring(0, ChatRules.MAX_NAME);
        boolean moderator = ChatRules.ROLE_MODERATOR.equals(role);
        Integer banned = jdbc.queryForObject("SELECT COUNT(*) FROM chat_members WHERE user_id = ? AND banned = 1", Integer.class, userId);
        jdbc.update("INSERT IGNORE INTO chat_members (room_id, user_id, role, display_name, rules_accepted_at, banned, joined_at) VALUES (?, ?, ?, ?, "
                        + (moderator ? "NOW()" : "NULL") + ", ?, NOW())", roomId, userId, role, moderator ? name : null, banned != null && banned > 0 ? 1 : 0);
        jdbc.update("UPDATE chat_members SET role = ?, left_at = NULL WHERE room_id = ? AND user_id = ?", role, roomId, userId);
        if (moderator) jdbc.update("UPDATE chat_members SET display_name = COALESCE(display_name, ?), rules_accepted_at = COALESCE(rules_accepted_at, NOW()) WHERE room_id = ? AND user_id = ?",
                name, roomId, userId);
    }

    public void removeMember(long roomId, long userId) {
        jdbc.update("UPDATE chat_members SET left_at = NOW(), role = 'member' WHERE room_id = ? AND user_id = ?", roomId, userId);
    }
}
