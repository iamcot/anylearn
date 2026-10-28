package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.S3Service;
import com.anylearn.backend.service.sticker.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/** Back office of the sticker game (plan 14, phase 3): the set, who owns what, trades, the review queue and settings. */
@RestController
@RequestMapping("/admin/stickers")
@RequiredArgsConstructor
public class AdminStickerController {

    private final JdbcTemplate jdbc;
    private final StickerService stickers;
    private final StickerTradeService trades;
    private final WelcomePackService welcomePacks;
    private final RiskService risk;
    private final StickerSettings settings;
    private final S3Service s3Service;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        List<Map<String, Object>> items = jdbc.queryForList(
                "SELECT d.id, d.name, d.description, d.emoji, d.image_url AS image, d.rarity, d.drop_weight AS dropWeight, d.active, d.sort_order AS sortOrder, " +
                        "(SELECT COUNT(*) FROM user_stickers us WHERE us.sticker_id = d.id AND us.qty > 0) AS owners, " +
                        "(SELECT COALESCE(SUM(us.qty), 0) FROM user_stickers us WHERE us.sticker_id = d.id) AS copies " +
                        "FROM sticker_defs d ORDER BY d.sort_order, d.id");
        for (Map<String, Object> item : items) item.put("rarityLabel", StickerRules.rarityLabel(String.valueOf(item.get("rarity"))));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", items);
        out.put("playersWithStickers", stickers.count("SELECT COUNT(DISTINCT user_id) FROM user_stickers WHERE qty > 0"));
        out.put("tradesToday", stickers.count("SELECT COUNT(*) FROM sticker_trades WHERE status = 'done' AND created_at >= CURDATE()"));
        out.put("grantsToday", stickers.count("SELECT COUNT(*) FROM sticker_grants WHERE created_at >= CURDATE()"));
        out.put("review", stickers.count("SELECT COUNT(*) FROM welcome_packs WHERE status = 'review'"));
        return ApiResponse.ok(out);
    }

    private String saveDef(Long id, String name, String description, String emoji, String rarity, Integer dropWeight, Boolean active, Integer sortOrder, MultipartFile image) {
        String cleanName = name == null ? "" : name.trim();
        if (cleanName.isEmpty() || cleanName.length() > 80) return "Tên sticker từ 1 đến 80 ký tự";
        String cleanRarity = StickerRules.cleanRarity(rarity);
        if (cleanRarity == null) return "Độ hiếm không hợp lệ";
        int weight = dropWeight == null ? 10 : dropWeight;
        if (weight < 0 || weight > 1000) return "Tỉ lệ rơi từ 0 đến 1000";
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            try {
                imageUrl = s3Service.uploadImage(image, "stickers", 512);
            } catch (Exception e) {
                return "Upload hình thất bại: " + e.getMessage();
            }
        }
        String cleanEmoji = emoji == null || emoji.isBlank() ? null : emoji.trim();
        if (cleanEmoji != null && cleanEmoji.length() > 16) return "Emoji quá dài";
        String desc = description == null || description.isBlank() ? null : description.trim();
        if (desc != null && desc.length() > 255) return "Nội dung tối đa 255 ký tự";
        if (id == null) {
            jdbc.update("INSERT INTO sticker_defs (name, description, emoji, image_url, rarity, drop_weight, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    cleanName, desc, cleanEmoji, imageUrl, cleanRarity, weight, active == null || active ? 1 : 0, sortOrder == null ? 0 : sortOrder);
        } else {
            jdbc.update("UPDATE sticker_defs SET name = ?, description = ?, emoji = ?, rarity = ?, drop_weight = ?, active = ?, sort_order = ?" +
                            (imageUrl != null ? ", image_url = ?" : "") + " WHERE id = ?",
                    imageUrl != null
                            ? new Object[]{cleanName, desc, cleanEmoji, cleanRarity, weight, active == null || active ? 1 : 0, sortOrder == null ? 0 : sortOrder, imageUrl, id}
                            : new Object[]{cleanName, desc, cleanEmoji, cleanRarity, weight, active == null || active ? 1 : 0, sortOrder == null ? 0 : sortOrder, id});
        }
        return null;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestParam String name, @RequestParam(required = false) String description,
                                 @RequestParam(required = false) String emoji, @RequestParam String rarity, @RequestParam(required = false) Integer dropWeight,
                                 @RequestParam(required = false) Boolean active, @RequestParam(required = false) Integer sortOrder,
                                 @RequestParam(required = false) MultipartFile image) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = saveDef(null, name, description, emoji, rarity, dropWeight, active, sortOrder, image);
        return problem == null ? list(user) : ApiResponse.fail(problem);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable long id, @RequestParam String name, @RequestParam(required = false) String description,
                                 @RequestParam(required = false) String emoji, @RequestParam String rarity, @RequestParam(required = false) Integer dropWeight,
                                 @RequestParam(required = false) Boolean active, @RequestParam(required = false) Integer sortOrder,
                                 @RequestParam(required = false) MultipartFile image) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (stickers.view(id) == null) return ApiResponse.fail("Không tìm thấy sticker");
        String problem = saveDef(id, name, description, emoji, rarity, dropWeight, active, sortOrder, image);
        return problem == null ? list(user) : ApiResponse.fail(problem);
    }

    @GetMapping("/members")
    public ApiResponse<?> members(@AuthenticationPrincipal User user, @RequestParam(required = false) String q) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String like = "%" + (q == null ? "" : q.trim()) + "%";
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT u.id, u.name, u.phone, COALESCE(SUM(us.qty), 0) AS copies, COUNT(us.sticker_id) AS kinds FROM users u " +
                        "JOIN user_stickers us ON us.user_id = u.id AND us.qty > 0 WHERE (u.name LIKE ? OR u.phone LIKE ?) GROUP BY u.id, u.name, u.phone ORDER BY copies DESC LIMIT 30", like, like);
        return ApiResponse.ok(rows);
    }

    @GetMapping("/members/{userId}")
    public ApiResponse<?> member(@AuthenticationPrincipal User user, @PathVariable long userId) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>(stickers.album(userId));
        out.put("user", jdbc.queryForList("SELECT id, name, phone FROM users WHERE id = ?", userId).stream().findFirst().orElse(null));
        out.put("risk", risk.flagged(1000).stream().filter(r -> ((Number) r.get("userId")).longValue() == userId).findFirst().orElse(null));
        return ApiResponse.ok(out);
    }

    @PostMapping("/grant")
    public ApiResponse<?> grant(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("userId") instanceof Number userId) || !(body.get("stickerId") instanceof Number stickerId)) return ApiResponse.fail("Thiếu thành viên hoặc sticker");
        if (stickers.view(stickerId.longValue()) == null) return ApiResponse.fail("Không tìm thấy sticker");
        stickers.grant(userId.longValue(), stickerId.longValue(), "admin", "admin#" + user.getId(), null);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @PostMapping("/revoke")
    public ApiResponse<?> revoke(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("userId") instanceof Number userId) || !(body.get("stickerId") instanceof Number stickerId)) return ApiResponse.fail("Thiếu thành viên hoặc sticker");
        if (!stickers.takeOne(userId.longValue(), stickerId.longValue(), 0)) return ApiResponse.fail("Thành viên không có sticker này");
        return ApiResponse.ok(Map.of("ok", true));
    }

    @GetMapping("/trades")
    public ApiResponse<?> tradeList(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "1") int page) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        int offset = (Math.max(page, 1) - 1) * 30;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT t.id, t.a_user AS aUser, ua.name AS aName, ua.phone AS aPhone, t.b_user AS bUser, ub.name AS bName, ub.phone AS bPhone, " +
                        "sa.name AS aSticker, sb.name AS bSticker, t.status, t.created_at AS createdAt FROM sticker_trades t " +
                        "LEFT JOIN users ua ON ua.id = t.a_user LEFT JOIN users ub ON ub.id = t.b_user " +
                        "LEFT JOIN sticker_defs sa ON sa.id = t.a_sticker LEFT JOIN sticker_defs sb ON sb.id = t.b_sticker ORDER BY t.id DESC LIMIT 30 OFFSET ?", offset);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", stickers.count("SELECT COUNT(*) FROM sticker_trades"));
        out.put("busiestPairs", jdbc.queryForList(
                "SELECT t.a_user AS aUser, ua.name AS aName, t.b_user AS bUser, ub.name AS bName, COUNT(*) AS trades FROM sticker_trades t " +
                        "LEFT JOIN users ua ON ua.id = t.a_user LEFT JOIN users ub ON ub.id = t.b_user WHERE t.status = 'done' " +
                        "GROUP BY t.pair_key, t.a_user, t.b_user, ua.name, ub.name HAVING COUNT(*) > 1 ORDER BY trades DESC LIMIT 10"));
        return ApiResponse.ok(out);
    }

    @PostMapping("/trades/{id}/cancel")
    public ApiResponse<?> cancelTrade(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            trades.adminCancel(id);
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/review")
    public ApiResponse<?> review(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("welcome", welcomePacks.reviewQueue());
        out.put("flagged", risk.flagged(100));
        return ApiResponse.ok(out);
    }

    @PostMapping("/review/{userId}/approve")
    public ApiResponse<?> approve(@AuthenticationPrincipal User user, @PathVariable long userId) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            welcomePacks.approve(userId);
            return review(user);
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/review/{userId}/reject")
    public ApiResponse<?> reject(@AuthenticationPrincipal User user, @PathVariable long userId) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            welcomePacks.cancel(userId);
            return review(user);
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    /** blocked = cannot trade and rewards wait; cleared = a high score no longer holds rewards; open = back to automatic. */
    @PostMapping("/risk/{userId}")
    public ApiResponse<?> setRisk(@AuthenticationPrincipal User user, @PathVariable long userId, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String status = String.valueOf(body.get("status"));
        if (!List.of("blocked", "cleared", "open").contains(status)) return ApiResponse.fail("Trạng thái không hợp lệ");
        risk.setStatus(userId, status);
        return review(user);
    }

    @GetMapping("/settings")
    public ApiResponse<?> getSettings(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(settings.asMap());
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        return problem == null ? ApiResponse.ok(settings.asMap()) : ApiResponse.fail(problem);
    }
}
