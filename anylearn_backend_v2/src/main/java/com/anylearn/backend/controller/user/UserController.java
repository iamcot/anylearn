package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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

    @GetMapping("/friends/{userId}")
    public ApiResponse<?> friends(@PathVariable Long userId) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/user/edit")
    public ApiResponse<?> edit(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/user/upload-image/{type}")
    public ApiResponse<?> uploadImage(@PathVariable String type, @RequestParam MultipartFile file) {
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
    public ApiResponse<?> notification() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/notification/{id}")
    public ApiResponse<?> notifRead(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
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

    @PostMapping("/user/changepass")
    public ApiResponse<?> changePass(@RequestBody Object body) {
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

    @GetMapping("/user/children")
    public ApiResponse<?> listChildren() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/user/children")
    public ApiResponse<?> saveChildren(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/user/childrenv2")
    public ApiResponse<?> saveChildrenV2(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }
}
