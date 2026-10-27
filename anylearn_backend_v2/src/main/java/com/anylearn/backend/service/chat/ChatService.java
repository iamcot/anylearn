package com.anylearn.backend.service.chat;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.NotificationSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.sql.Timestamp;
import java.util.*;

/** Class chat (plan 11): one room per class, members come from enrollments. All access checks live here. */
@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private static final int PAGE = 40;
    private static final String HIDDEN_TEXT = "Tin nhắn này đã bị ẩn";

    private final JdbcTemplate jdbc;
    private final ChatSettings settings;
    private final NotificationSseService sse;
    private final NotificationService notifications;
    private final UserRepository users;

    // ---------- membership ----------

    /** Creates the rooms and memberships the person is entitled to and ends the ones that no longer apply. */
    public void sync(User user) {
        if (!settings.enabled() || user.getIsChild() != null && user.getIsChild() == 1) return;
        Long uid = user.getId();
        int retention = settings.retentionDays();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT uce.schedule_id sid, uce.item_id iid, uce.status st, uce.end_date ed, i.title it, isc.title sct "
                        + "FROM user_course_enrollments uce JOIN items i ON i.id = uce.item_id "
                        + "JOIN item_schedules isc ON isc.id = uce.schedule_id "
                        + "LEFT JOIN users l ON l.id = uce.user_id AND l.is_child = 1 "
                        + "WHERE uce.status = 'active' AND uce.schedule_id IS NOT NULL AND (uce.user_id = ? OR l.user_id = ?)", uid, uid);
        boolean banned = isBannedAnywhere(uid);
        Set<Long> eligible = new HashSet<>();
        for (Map<String, Object> r : rows) {
            if (!ChatRules.stillInGroup((String) r.get("st"), toDate(r.get("ed")), today, retention)) continue;
            long roomId = ensureRoom(((Number) r.get("sid")).longValue(), ((Number) r.get("iid")).longValue(), title(r));
            eligible.add(roomId);
            ensureMember(roomId, uid, ChatRules.ROLE_MEMBER, banned, null);
        }
        for (Map<String, Object> m : jdbc.queryForList("SELECT room_id, left_at FROM chat_members WHERE user_id = ? AND role = 'member'", uid)) {
            long roomId = ((Number) m.get("room_id")).longValue();
            if (eligible.contains(roomId) && m.get("left_at") != null) {
                jdbc.update("UPDATE chat_members SET left_at = NULL WHERE room_id = ? AND user_id = ?", roomId, uid);
            } else if (!eligible.contains(roomId) && m.get("left_at") == null) {
                jdbc.update("UPDATE chat_members SET left_at = NOW() WHERE room_id = ? AND user_id = ?", roomId, uid);
            }
        }
        if (settings.partnerModerator()) {
            for (Long roomId : jdbc.queryForList("SELECT r.id FROM chat_rooms r JOIN items i ON i.id = r.item_id WHERE i.user_id = ?", Long.class, uid)) {
                ensureMember(roomId, uid, ChatRules.ROLE_MODERATOR, banned, user.getName());
            }
        }
    }

    /** MySQL tinyint flags come back as Boolean or Number depending on the driver settings. */
    static boolean flag(Object value) {
        return value instanceof Boolean b ? b : value instanceof Number n && n.intValue() == 1;
    }

    static LocalDateTime toDateTime(Object value) {
        if (value instanceof LocalDateTime t) return t;
        return value instanceof Timestamp t ? t.toLocalDateTime() : null;
    }

    static LocalDate toDate(Object value) {
        if (value instanceof LocalDate d) return d;
        return value instanceof java.sql.Date d ? d.toLocalDate() : null;
    }

    private static String title(Map<String, Object> r) {
        String item = String.valueOf(r.get("it"));
        Object sc = r.get("sct");
        return sc == null || sc.toString().isBlank() ? item : item + " · " + sc;
    }

    private long ensureRoom(long scheduleId, long itemId, String title) {
        jdbc.update("INSERT IGNORE INTO chat_rooms (item_schedule_id, item_id, title, created_at) VALUES (?, ?, ?, NOW())",
                scheduleId, itemId, title.length() > 255 ? title.substring(0, 255) : title);
        return jdbc.queryForObject("SELECT id FROM chat_rooms WHERE item_schedule_id = ?", Long.class, scheduleId);
    }

    /** A moderator keeps an existing membership; a moderator row is created with the person's name already chosen. */
    private void ensureMember(long roomId, long userId, String role, boolean banned, String name) {
        boolean moderator = ChatRules.ROLE_MODERATOR.equals(role);
        String display = name == null ? null : name.length() > ChatRules.MAX_NAME ? name.substring(0, ChatRules.MAX_NAME) : name;
        jdbc.update("INSERT IGNORE INTO chat_members (room_id, user_id, role, display_name, rules_accepted_at, banned, joined_at) "
                        + "VALUES (?, ?, ?, ?, " + (moderator && display != null ? "NOW()" : "NULL") + ", ?, NOW())",
                roomId, userId, role, display, banned ? 1 : 0);
        if (moderator) jdbc.update("UPDATE chat_members SET role = 'moderator', left_at = NULL WHERE room_id = ? AND user_id = ?", roomId, userId);
    }

    private boolean isBannedAnywhere(long userId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM chat_members WHERE user_id = ? AND banned = 1", Integer.class, userId);
        return n != null && n > 0;
    }

    private Map<String, Object> member(long roomId, long userId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT m.*, r.is_locked, r.title FROM chat_members m JOIN chat_rooms r ON r.id = m.room_id "
                        + "WHERE m.room_id = ? AND m.user_id = ? AND m.left_at IS NULL", roomId, userId);
        if (rows.isEmpty() || !settings.enabled()) throw new IllegalArgumentException("Bạn không ở trong nhóm này");
        return rows.get(0);
    }

    // ---------- reading ----------

    public List<Map<String, Object>> myRooms(User user) {
        sync(user);
        if (!settings.enabled()) return List.of();
        List<Map<String, Object>> rooms = jdbc.queryForList(
                "SELECT r.id, r.title, r.is_locked AS locked, m.role, (m.rules_accepted_at IS NOT NULL) AS joined, "
                        + "(SELECT COUNT(*) FROM chat_messages x WHERE x.room_id = r.id AND x.id > COALESCE(m.last_read_message_id, 0) "
                        + "  AND x.user_id <> m.user_id AND x.is_hidden = 0) AS unread, "
                        + "(SELECT x.body FROM chat_messages x WHERE x.room_id = r.id AND x.is_hidden = 0 ORDER BY x.id DESC LIMIT 1) AS last_body, "
                        + "(SELECT x.created_at FROM chat_messages x WHERE x.room_id = r.id AND x.is_hidden = 0 ORDER BY x.id DESC LIMIT 1) AS last_at "
                        + "FROM chat_members m JOIN chat_rooms r ON r.id = m.room_id "
                        + "WHERE m.user_id = ? AND m.left_at IS NULL ORDER BY last_at IS NULL, last_at DESC, r.id DESC", user.getId());
        for (Map<String, Object> r : rooms) {
            r.put("locked", flag(r.get("locked")));
            r.put("joined", flag(r.get("joined")));
        }
        return rooms;
    }

    public long unreadTotal(User user) {
        if (!settings.enabled()) return 0;
        Long n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM chat_messages x JOIN chat_members m ON m.room_id = x.room_id "
                        + "WHERE m.user_id = ? AND m.left_at IS NULL AND x.id > COALESCE(m.last_read_message_id, 0) AND x.user_id <> m.user_id AND x.is_hidden = 0",
                Long.class, user.getId());
        return n == null ? 0 : n;
    }

    public Map<String, Object> room(User user, long roomId) {
        Map<String, Object> m = member(roomId, user.getId());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", roomId);
        out.put("title", m.get("title"));
        out.put("locked", flag(m.get("is_locked")));
        out.put("role", m.get("role"));
        out.put("joined", m.get("rules_accepted_at") != null);
        out.put("displayName", m.get("display_name"));
        out.put("banned", flag(m.get("banned")));
        out.put("rulesText", settings.rulesText());
        out.put("pinned", messages(user, roomId, jdbc.queryForList(
                "SELECT x.* FROM chat_messages x WHERE x.room_id = ? AND x.is_pinned = 1 AND x.is_hidden = 0 ORDER BY x.id DESC LIMIT 3", roomId)));
        return out;
    }

    /** {@code after} = newer than this id (polling); otherwise the page older than {@code before} (null = latest). Oldest first. */
    public List<Map<String, Object>> messages(User user, long roomId, Long before, Long after) {
        member(roomId, user.getId());
        List<Map<String, Object>> rows;
        if (after != null) {
            rows = jdbc.queryForList("SELECT x.* FROM chat_messages x WHERE x.room_id = ? AND x.id > ? ORDER BY x.id LIMIT 200", roomId, after);
        } else {
            rows = jdbc.queryForList("SELECT x.* FROM chat_messages x WHERE x.room_id = ? AND x.id < ? ORDER BY x.id DESC LIMIT " + PAGE,
                    roomId, before == null ? Long.MAX_VALUE : before);
            Collections.reverse(rows);
        }
        return messages(user, roomId, rows);
    }

    private List<Map<String, Object>> messages(User user, long roomId, List<Map<String, Object>> rows) {
        Map<Long, Map<String, Object>> names = new HashMap<>();
        for (Map<String, Object> m : jdbc.queryForList("SELECT user_id, display_name, role FROM chat_members WHERE room_id = ?", roomId)) {
            names.put(((Number) m.get("user_id")).longValue(), m);
        }
        Map<Long, Map<String, Object>> byId = new HashMap<>();
        for (Map<String, Object> r : rows) byId.put(((Number) r.get("id")).longValue(), r);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long authorId = ((Number) r.get("user_id")).longValue();
            boolean hidden = flag(r.get("is_hidden"));
            Map<String, Object> author = names.get(authorId);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.get("id"));
            m.put("type", r.get("type"));
            m.put("mine", authorId == user.getId());
            m.put("name", author == null || author.get("display_name") == null ? "Thành viên" : author.get("display_name"));
            m.put("role", author == null ? ChatRules.ROLE_MEMBER : author.get("role"));
            m.put("hidden", hidden);
            m.put("body", hidden ? HIDDEN_TEXT : r.get("body"));
            m.put("pinned", flag(r.get("is_pinned")));
            m.put("createdAt", r.get("created_at"));
            Object replyTo = r.get("reply_to_id");
            if (replyTo != null) m.put("replyTo", replyPreview(roomId, ((Number) replyTo).longValue(), byId, names));
            out.add(m);
        }
        return out;
    }

    private Map<String, Object> replyPreview(long roomId, long id, Map<Long, Map<String, Object>> loaded, Map<Long, Map<String, Object>> names) {
        Map<String, Object> r = loaded.get(id);
        if (r == null) {
            List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM chat_messages WHERE id = ? AND room_id = ?", id, roomId);
            if (rows.isEmpty()) return null;
            r = rows.get(0);
        }
        Map<String, Object> author = names.get(((Number) r.get("user_id")).longValue());
        boolean hidden = flag(r.get("is_hidden"));
        String body = hidden ? HIDDEN_TEXT : String.valueOf(r.get("body"));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", id);
        out.put("name", author == null || author.get("display_name") == null ? "Thành viên" : author.get("display_name"));
        out.put("body", body.length() > 80 ? body.substring(0, 80) + "…" : body);
        return out;
    }

    // ---------- writing ----------

    public void join(User user, long roomId, String displayName, boolean acceptRules) {
        Map<String, Object> m = member(roomId, user.getId());
        if (!acceptRules) throw new IllegalArgumentException("Bạn cần đồng ý nội quy nhóm");
        String name = ChatRules.cleanDisplayName(displayName);
        // Same name must not be taken twice in a room, otherwise parents cannot tell each other apart.
        Integer taken = jdbc.queryForObject("SELECT COUNT(*) FROM chat_members WHERE room_id = ? AND user_id <> ? AND LOWER(display_name) = LOWER(?) AND left_at IS NULL",
                Integer.class, roomId, user.getId(), name);
        if (taken != null && taken > 0) throw new IllegalArgumentException("Tên này đã có người dùng trong nhóm, hãy chọn tên khác");
        jdbc.update("UPDATE chat_members SET display_name = ?, rules_accepted_at = COALESCE(rules_accepted_at, NOW()) WHERE room_id = ? AND user_id = ?",
                name, roomId, user.getId());
    }

    public Map<String, Object> send(User user, long roomId, String rawBody, Long replyToId, boolean announcement) {
        Map<String, Object> m = member(roomId, user.getId());
        boolean moderator = ChatRules.isModerator((String) m.get("role"));
        LocalDateTime now = LocalDateTime.now();
        String problem = ChatRules.sendProblem(flag(m.get("is_locked")), flag(m.get("banned")),
                toDateTime(m.get("muted_until")), m.get("rules_accepted_at") != null, false, moderator, now);
        if (problem != null) throw new IllegalArgumentException(problem);
        String body = ChatRules.cleanBody(rawBody);
        if (announcement && !moderator) throw new IllegalArgumentException("Chỉ giáo viên hoặc đối tác được gửi thông báo cả lớp");
        if (ChatRules.findBannedWord(body, settings.bannedWords()) != null) throw new IllegalArgumentException("Tin nhắn có từ ngữ không phù hợp với nội quy nhóm");
        Long recent = jdbc.queryForObject("SELECT COUNT(*) FROM chat_messages WHERE user_id = ? AND created_at > ?", Long.class,
                user.getId(), Timestamp.valueOf(now.minusMinutes(1)));
        if (ChatRules.rateLimited(recent == null ? 0 : recent, settings.ratePerMinute())) throw new IllegalArgumentException("Bạn nhắn quá nhanh, hãy chờ một chút");
        if (replyToId != null) {
            Integer ok = jdbc.queryForObject("SELECT COUNT(*) FROM chat_messages WHERE id = ? AND room_id = ?", Integer.class, replyToId, roomId);
            if (ok == null || ok == 0) replyToId = null;
        }
        final Long reply = replyToId;
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO chat_messages (room_id, user_id, type, body, reply_to_id, created_at) VALUES (?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, roomId);
            ps.setLong(2, user.getId());
            ps.setString(3, announcement ? "announcement" : "text");
            ps.setString(4, body);
            if (reply == null) ps.setNull(5, java.sql.Types.BIGINT); else ps.setLong(5, reply);
            ps.setTimestamp(6, Timestamp.valueOf(now));
            return ps;
        }, keys);
        long id = keys.getKey().longValue();
        jdbc.update("UPDATE chat_members SET last_read_message_id = ? WHERE room_id = ? AND user_id = ?", id, roomId, user.getId());
        fanOut(roomId, user.getId(), announcement, (String) m.get("title"), body);
        return messages(user, roomId, jdbc.queryForList("SELECT * FROM chat_messages WHERE id = ?", id)).get(0);
    }

    private void fanOut(long roomId, long senderId, boolean announcement, String title, String body) {
        List<Long> others = jdbc.queryForList("SELECT user_id FROM chat_members WHERE room_id = ? AND user_id <> ? AND left_at IS NULL AND banned = 0",
                Long.class, roomId, senderId);
        for (Long other : others) {
            try {
                sse.notifyChat(other, roomId);
                if (announcement) {
                    notifications.createNotification(other, "chat_announcement", "Thông báo lớp: " + title,
                            body.length() > 120 ? body.substring(0, 120) + "…" : body, "/today/community/" + roomId);
                }
            } catch (Exception e) {
                log.warn("[chat] user {} not told about room {}: {}", other, roomId, e.getMessage());
            }
        }
    }

    public void markRead(User user, long roomId, long messageId) {
        member(roomId, user.getId());
        jdbc.update("UPDATE chat_members SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), ?) WHERE room_id = ? AND user_id = ?",
                messageId, roomId, user.getId());
    }

    public void report(User user, long messageId, String rawReason) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT room_id, user_id FROM chat_messages WHERE id = ?", messageId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy tin nhắn");
        long roomId = ((Number) rows.get(0).get("room_id")).longValue();
        member(roomId, user.getId());
        if (((Number) rows.get(0).get("user_id")).longValue() == user.getId()) throw new IllegalArgumentException("Bạn không thể báo cáo tin của chính mình");
        String reason = ChatRules.cleanReason(rawReason);
        int added = jdbc.update("INSERT IGNORE INTO chat_reports (message_id, reporter_id, reason, created_at) VALUES (?, ?, ?, NOW())", messageId, user.getId(), reason);
        if (added == 0) throw new IllegalArgumentException("Bạn đã báo cáo tin này rồi");
        for (User admin : users.findAdminNotificationRecipients()) {
            try {
                notifications.createNotification(admin.getId(), "system_notif", "Có báo cáo tin nhắn trong nhóm lớp", reason, "/admin/chat", null);
            } catch (Exception e) {
                log.warn("[chat] admin {} not notified: {}", admin.getId(), e.getMessage());
            }
        }
    }

    // ---------- moderation by the class moderator ----------

    private void requireModerator(User actor, long roomId) {
        if ("admin".equals(actor.getRole())) return;
        Map<String, Object> m = member(roomId, actor.getId());
        if (!ChatRules.isModerator((String) m.get("role"))) throw new IllegalArgumentException("Bạn không có quyền kiểm duyệt nhóm này");
    }

    private long roomOf(long messageId) {
        List<Long> r = jdbc.queryForList("SELECT room_id FROM chat_messages WHERE id = ?", Long.class, messageId);
        if (r.isEmpty()) throw new IllegalArgumentException("Không tìm thấy tin nhắn");
        return r.get(0);
    }

    public void setHidden(User actor, long messageId, boolean hidden) {
        requireModerator(actor, roomOf(messageId));
        jdbc.update("UPDATE chat_messages SET is_hidden = ?, hidden_by = ?, hidden_at = " + (hidden ? "NOW()" : "NULL") + " WHERE id = ?",
                hidden ? 1 : 0, hidden ? actor.getId() : null, messageId);
        if (hidden) jdbc.update("UPDATE chat_reports SET status = 'hidden', handled_by = ?, handled_at = NOW() WHERE message_id = ? AND status = 'open'", actor.getId(), messageId);
    }

    public void setPinned(User actor, long messageId, boolean pinned) {
        requireModerator(actor, roomOf(messageId));
        jdbc.update("UPDATE chat_messages SET is_pinned = ? WHERE id = ?", pinned ? 1 : 0, messageId);
    }
}
