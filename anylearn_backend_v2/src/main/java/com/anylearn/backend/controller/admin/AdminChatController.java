package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.chat.ChatAdminService;
import com.anylearn.backend.service.chat.ChatSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Back office page "Chat lớp": reports, hiding messages, locking rooms and people, adding supporters, settings. */
@RestController
@RequestMapping("/admin/chat")
@RequiredArgsConstructor
public class AdminChatController {

    private final ChatAdminService admin;
    private final ChatSettings settings;

    @GetMapping("/reports")
    public ApiResponse<?> reports(@AuthenticationPrincipal User user, @RequestParam(required = false) String status) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(admin.reports(status));
    }

    /** body: {action: hide | dismiss, ban?: true, muteDays?: n}; ban locks the author in every room. */
    @PutMapping("/reports/{id}")
    public ApiResponse<?> handle(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String action = body.get("action") instanceof String s ? s : "";
        int muteDays = body.get("muteDays") instanceof Number n ? n.intValue() : 0;
        admin.handleReport(user, id, action, Boolean.TRUE.equals(body.get("ban")), muteDays);
        return ApiResponse.ok();
    }

    @GetMapping("/rooms")
    public ApiResponse<?> rooms(@AuthenticationPrincipal User user, @RequestParam(required = false) String q) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(admin.rooms(q));
    }

    @PutMapping("/rooms/{id}/lock")
    public ApiResponse<?> lock(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        admin.lockRoom(id, Boolean.TRUE.equals(body.get("locked")));
        return ApiResponse.ok();
    }

    @GetMapping("/rooms/{id}/messages")
    public ApiResponse<?> messages(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(admin.recentMessages(id));
    }

    @PutMapping("/messages/{id}/hidden")
    public ApiResponse<?> hide(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        admin.setHidden(user, id, !Boolean.FALSE.equals(body.get("hidden")));
        return ApiResponse.ok();
    }

    @GetMapping("/rooms/{id}/members")
    public ApiResponse<?> members(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(admin.members(id));
    }

    /** body: {userId, role: member | moderator}: an admin adds a teacher or supporter to a group. */
    @PostMapping("/rooms/{id}/members")
    public ApiResponse<?> addMember(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("userId") instanceof Number n)) return ApiResponse.fail("Thiếu người dùng");
        admin.addMember(id, n.longValue(), body.get("role") instanceof String s ? s : "moderator");
        return ApiResponse.ok();
    }

    @DeleteMapping("/rooms/{id}/members/{userId}")
    public ApiResponse<?> removeMember(@AuthenticationPrincipal User user, @PathVariable long id, @PathVariable long userId) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        admin.removeMember(id, userId);
        return ApiResponse.ok();
    }

    /** body: {banned: bool, muteDays?: n}; applies to every room of the person. */
    @PutMapping("/users/{userId}/ban")
    public ApiResponse<?> ban(@AuthenticationPrincipal User user, @PathVariable long userId, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        admin.setBanned(userId, Boolean.TRUE.equals(body.get("banned")));
        return ApiResponse.ok();
    }

    @GetMapping("/banned")
    public ApiResponse<?> banned(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(admin.banned());
    }

    @GetMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(settings.current());
    }

    @PutMapping("/settings")
    public ApiResponse<?> save(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        return problem == null ? ApiResponse.ok(settings.current()) : ApiResponse.fail(problem);
    }

    private boolean isAdmin(User u) {
        return u != null && "admin".equals(u.getRole());
    }
}
