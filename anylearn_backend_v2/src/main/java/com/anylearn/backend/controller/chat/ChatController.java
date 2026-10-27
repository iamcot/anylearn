package com.anylearn.backend.controller.chat;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.chat.ChatService;
import com.anylearn.backend.service.chat.ChatSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Class chat for logged-in members (plan 11). Every call checks membership in {@link ChatService}. */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chat;
    private final ChatSettings settings;

    @GetMapping("/rooms")
    public ApiResponse<?> rooms(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(Map.of("enabled", settings.enabled(), "rooms", chat.myRooms(user)));
    }

    @GetMapping("/unread")
    public ApiResponse<?> unread(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(Map.of("unread", chat.unreadTotal(user)));
    }

    @GetMapping("/rooms/{roomId}")
    public ApiResponse<?> room(@AuthenticationPrincipal User user, @PathVariable long roomId) {
        return ApiResponse.ok(chat.room(user, roomId));
    }

    @PostMapping("/rooms/{roomId}/join")
    public ApiResponse<?> join(@AuthenticationPrincipal User user, @PathVariable long roomId, @RequestBody Map<String, Object> body) {
        chat.join(user, roomId, body.get("displayName") instanceof String s ? s : null, Boolean.TRUE.equals(body.get("acceptRules")));
        return ApiResponse.ok(chat.room(user, roomId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<?> messages(@AuthenticationPrincipal User user, @PathVariable long roomId,
                                   @RequestParam(required = false) Long before, @RequestParam(required = false) Long after) {
        return ApiResponse.ok(chat.messages(user, roomId, before, after));
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ApiResponse<?> send(@AuthenticationPrincipal User user, @PathVariable long roomId, @RequestBody Map<String, Object> body) {
        Long replyTo = body.get("replyToId") instanceof Number n ? n.longValue() : null;
        return ApiResponse.ok(chat.send(user, roomId, body.get("body") instanceof String s ? s : null, replyTo,
                Boolean.TRUE.equals(body.get("announcement"))));
    }

    @PostMapping("/rooms/{roomId}/read")
    public ApiResponse<?> read(@AuthenticationPrincipal User user, @PathVariable long roomId, @RequestBody Map<String, Object> body) {
        if (body.get("messageId") instanceof Number n) chat.markRead(user, roomId, n.longValue());
        return ApiResponse.ok();
    }

    @PostMapping("/messages/{messageId}/report")
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @PathVariable long messageId, @RequestBody Map<String, Object> body) {
        chat.report(user, messageId, body.get("reason") instanceof String s ? s : null);
        return ApiResponse.ok();
    }

    /** Moderator of the class (partner, teacher) or admin. */
    @PostMapping("/messages/{messageId}/hide")
    public ApiResponse<?> hide(@AuthenticationPrincipal User user, @PathVariable long messageId, @RequestBody(required = false) Map<String, Object> body) {
        chat.setHidden(user, messageId, body == null || !Boolean.FALSE.equals(body.get("hidden")));
        return ApiResponse.ok();
    }

    @PostMapping("/messages/{messageId}/pin")
    public ApiResponse<?> pin(@AuthenticationPrincipal User user, @PathVariable long messageId, @RequestBody(required = false) Map<String, Object> body) {
        chat.setPinned(user, messageId, body == null || !Boolean.FALSE.equals(body.get("pinned")));
        return ApiResponse.ok();
    }
}
