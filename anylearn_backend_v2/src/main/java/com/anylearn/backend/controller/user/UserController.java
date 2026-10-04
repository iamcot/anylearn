package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.S3Service;
import com.anylearn.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final S3Service s3Service;
    private final NotificationService notificationService;

    @GetMapping("/users/{role}")
    public ApiResponse<?> usersList(@PathVariable String role,
                                    @RequestParam(defaultValue = "9999") int pageSize) {
        return ApiResponse.ok(userService.usersList(role, pageSize));
    }

    @GetMapping("/user/profile/{userId}")
    public ApiResponse<?> profile(@PathVariable Long userId) {
        return ApiResponse.ok(userService.profile(userId));
    }

    @GetMapping("/user")
    public ApiResponse<?> userInfo(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.userInfo(user));
    }

    @GetMapping("/user-less")
    public ApiResponse<?> userInfoLess(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.userInfoLess(user));
    }

    @PostMapping("/user/edit")
    public ApiResponse<?> edit(@RequestBody Map<String, Object> body,
                               @AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.editProfile(body, user));
    }

    @PostMapping("/user/changepass")
    public ApiResponse<?> changePass(@RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal User user) {
        String oldPass = body.get("oldPass") != null ? body.get("oldPass").toString() : "";
        String newPass = body.get("newPass") != null ? body.get("newPass").toString() : "";
        if (newPass.length() < 6) return ApiResponse.fail("Mật khẩu mới phải có ít nhất 6 ký tự");
        userService.changePassword(oldPass, newPass, user);
        return ApiResponse.ok("Đổi mật khẩu thành công");
    }

    @GetMapping("/user/children")
    public ApiResponse<?> listChildren(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.getChildren(user));
    }

    @PostMapping("/user/children")
    public ApiResponse<?> saveChildren(@RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.saveChild(body, user));
    }

    @DeleteMapping("/user/children/{childId}")
    public ApiResponse<?> deleteChild(@PathVariable Long childId,
                                      @AuthenticationPrincipal User user) {
        userService.deleteChild(childId, user);
        return ApiResponse.ok("Đã xóa tài khoản");
    }

    @GetMapping("/user/orders")
    public ApiResponse<?> userOrders(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.getUserOrders(user));
    }

    @GetMapping("/user/item-codes")
    public ApiResponse<?> itemCodes(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.getItemCodes(user));
    }

    @GetMapping("/user/wallet-c-history")
    public ApiResponse<?> walletCHistory(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.getWalletCHistory(user));
    }

    @PostMapping("/user/upload-image/{type}")
    public ApiResponse<?> uploadImage(@PathVariable String type,
                                      @RequestParam("file") MultipartFile file,
                                      @AuthenticationPrincipal User user) {
        try {
            String folder = "users/" + user.getId() + "/" + type;
            String imageUrl = s3Service.uploadImage(file, folder);
            return ApiResponse.ok(userService.updateImageUrl(type, imageUrl, user));
        } catch (Exception e) {
            log.error("Upload image error for user {}: {}", user.getId(), e.getMessage());
            return ApiResponse.fail("Upload ảnh thất bại: " + e.getMessage());
        }
    }

    // ── Stubs (keep for API compatibility) ───────────────────────────────────

    @GetMapping("/friends/{userId}")
    public ApiResponse<?> friends(@PathVariable Long userId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/mycalendar")
    public ApiResponse<?> myCalendar() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/join/{itemId}")
    public ApiResponse<?> confirmJoinCourse(@PathVariable Long itemId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/course-registered-users/{itemId}")
    public ApiResponse<?> courseRegisteredUsers(@PathVariable Long itemId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/get-docs")
    public ApiResponse<?> getDocs() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/user/add-doc")
    public ApiResponse<?> addDoc(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/remove-doc/{fileId}")
    public ApiResponse<?> removeDoc(@PathVariable Long fileId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/notification")
    public ApiResponse<?> notification(@AuthenticationPrincipal User user,
                                       @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(notificationService.getUserNotifications(user.getId(), page));
    }

    @GetMapping("/user/notification/{id}")
    public ApiResponse<?> notifRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.markAsRead(id, user.getId());
        return ApiResponse.ok(null);
    }

    @PostMapping("/user/notification/mark-all-read")
    public ApiResponse<?> notifMarkAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ApiResponse.ok(null);
    }

    @GetMapping("/user/all-friends")
    public ApiResponse<?> allFriends() {
        return ApiResponse.fail("Not implemented");
    }

    @RequestMapping(value = "/user/contract", method = {RequestMethod.GET, RequestMethod.POST})
    public ApiResponse<?> saveContract(@RequestBody(required = false) Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/contract/{contractId}")
    public ApiResponse<?> getContract(@PathVariable(required = false) Long contractId) {
        return ApiResponse.fail("Not implemented");
    }

    @RequestMapping(value = "/user/contract/sign/{contractId}", method = {RequestMethod.GET, RequestMethod.POST})
    public ApiResponse<?> signContract(@PathVariable Long contractId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/delete")
    public ApiResponse<?> deleteAccount() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/pending-orders")
    public ApiResponse<?> pendingOrders() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/user/childrenv2")
    public ApiResponse<?> saveChildrenV2(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }
}
