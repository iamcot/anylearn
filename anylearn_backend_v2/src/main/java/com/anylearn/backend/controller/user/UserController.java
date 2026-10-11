package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemActivityRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.S3Service;
import com.anylearn.backend.service.UserService;
import com.anylearn.backend.service.UserTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
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
    private final UserTrackingService userTrackingService;
    private final ItemUserActionRepository itemUserActionRepository;
    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final ItemActivityRepository itemActivityRepository;

    @GetMapping("/users/{role}")
    public ApiResponse<?> usersList(@PathVariable String role,
                                    @RequestParam(defaultValue = "9999") int pageSize) {
        return ApiResponse.ok(userService.usersList(role, pageSize));
    }

    @GetMapping("/user/profile/{userId}")
    public ApiResponse<?> profile(@PathVariable Long userId,
                                  @AuthenticationPrincipal User currentUser) {
        userTrackingService.recordView(userId, currentUser != null ? currentUser.getId() : null);
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

    @GetMapping("/user/favorites")
    public ApiResponse<?> favorites(@AuthenticationPrincipal User user,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(itemUserActionRepository.findFavedItemsByUser(
                user.getId(), PageRequest.of(page, size)));
    }

    @GetMapping("/user/schedule")
    public ApiResponse<?> schedule(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        var enrollments = enrollmentRepository.findEnrollmentsWithScheduleByUserId(user.getId());
        var activities  = itemActivityRepository.findByUserIdWithItemInfo(user.getId());
        return ApiResponse.ok(java.util.Map.of("enrollments", enrollments, "activities", activities));
    }

    @GetMapping("/user/upcoming")
    public ApiResponse<?> upcoming(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.ok(java.util.List.of());
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate limit = today.plusDays(7);

        var enrollments = enrollmentRepository.findEnrollmentsWithScheduleByUserId(user.getId());
        var activities  = itemActivityRepository.findByUserIdWithItemInfo(user.getId());

        java.util.List<java.util.Map<String,Object>> events = new java.util.ArrayList<>();

        java.util.Map<String,Integer> WD_MAP = java.util.Map.of(
            "mon",1,"tue",2,"wed",3,"thu",4,"fri",5,"sat",6,"sun",0);

        for (var row : enrollments) {
            String scheduleType = str(row,"schedule_type");
            String itemTitle    = str(row,"item_title");
            String seoUrl       = str(row,"seo_url");
            Long   itemId       = toLong(row,"item_id");

            if ("event".equals(scheduleType)) {
                String ed = str(row,"event_date");
                if (ed != null && !ed.isBlank()) {
                    java.time.LocalDate d = parseDate(ed);
                    if (d != null && !d.isBefore(today) && !d.isAfter(limit)) {
                        events.add(eventRow(d.toString(), "enrollment", "Lớp học", itemTitle, seoUrl, itemId, row));
                    }
                }
            } else if ("recurring".equals(scheduleType)) {
                String wds = str(row,"weekdays");
                String ds  = str(row,"date_start");
                String de  = str(row,"date_end");
                String sd  = str(row,"start_date");
                if (wds == null || wds.isBlank()) continue;
                java.util.Set<Integer> days = new java.util.HashSet<>();
                for (String w : wds.split(",")) { Integer v = WD_MAP.get(w.trim()); if (v != null) days.add(v); }
                java.time.LocalDate from = parseDate(sd != null ? sd : ds);
                java.time.LocalDate to   = parseDate(de);
                for (java.time.LocalDate d = today; !d.isAfter(limit); d = d.plusDays(1)) {
                    if (from != null && d.isBefore(from)) continue;
                    if (to != null && d.isAfter(to)) continue;
                    int dow = d.getDayOfWeek().getValue() % 7; // Mon=1..Sun=0
                    if (days.contains(dow)) events.add(eventRow(d.toString(), "enrollment", "Lớp học", itemTitle, seoUrl, itemId, row));
                }
            } else if (scheduleType == null || scheduleType.isBlank()) {
                // billing-only: show start_date and warn 7 days before end_date
                String sd = str(row,"start_date"); String ed = str(row,"end_date");
                java.time.LocalDate start = parseDate(sd); java.time.LocalDate end = parseDate(ed);
                if (start != null && !start.isBefore(today) && !start.isAfter(limit))
                    events.add(eventRow(start.toString(), "enrollment", "Bắt đầu học", itemTitle, seoUrl, itemId, row));
                if (end != null && !end.isBefore(today) && !end.isAfter(limit))
                    events.add(eventRow(end.toString(), "enrollment", "Hết hạn khóa học", itemTitle, seoUrl, itemId, row));
            }
        }

        for (var row : activities) {
            String dateStr = str(row,"date");
            if (dateStr == null || dateStr.isBlank()) continue;
            java.time.LocalDate d = parseDate(dateStr);
            if (d == null || d.isBefore(today) || d.isAfter(limit)) continue;
            Object status = row.get("status");
            if (status != null && "-1".equals(String.valueOf(status))) continue;
            String type = str(row,"type");
            String label = "trial".equals(type) ? "Học thử" : "test".equals(type) ? "Test đầu vào" : "Tham quan";
            events.add(eventRow(dateStr, "activity", label, str(row,"item_title"), str(row,"seo_url"),
                toLong(row,"item_id"), row));
        }

        events.sort((a, b) -> String.valueOf(a.get("date")).compareTo(String.valueOf(b.get("date"))));
        return ApiResponse.ok(events);
    }

    private String str(java.util.Map<?,?> m, String k) {
        Object v = m.get(k); return v != null ? v.toString() : null;
    }
    private Long toLong(java.util.Map<?,?> m, String k) {
        Object v = m.get(k); if (v == null) return null;
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }
    private java.time.LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return java.time.LocalDate.parse(s.substring(0, 10)); } catch (Exception e) { return null; }
    }
    private java.util.Map<String,Object> eventRow(String date, String kind, String label,
            String itemTitle, String seoUrl, Long itemId, java.util.Map<?,?> row) {
        var m = new java.util.LinkedHashMap<String,Object>();
        m.put("date", date); m.put("kind", kind); m.put("label", label);
        m.put("itemTitle", itemTitle != null ? itemTitle : "");
        m.put("seoUrl", seoUrl); m.put("itemId", itemId);
        String ts = str(row,"time_start"); String te = str(row,"time_end");
        if (ts != null) m.put("time", ts + (te != null ? "–"+te : ""));
        return m;
    }

    @PutMapping("/user/enrollments/{id}/start-date")
    public ApiResponse<?> setEnrollmentStartDate(@PathVariable Long id,
                                                   @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> body,
                                                   @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return enrollmentRepository.findById(id).map(e -> {
            if (!e.getUserId().equals(user.getId())) return ApiResponse.fail("Không có quyền");
            String dateStr = body.get("startDate") instanceof String s ? s : null;
            if (dateStr == null) return ApiResponse.fail("Thiếu ngày bắt đầu");
            try {
                e.setStartDate(java.time.LocalDate.parse(dateStr));
                e.setStatus("active");
                e.setUpdatedAt(java.time.LocalDateTime.now());
                enrollmentRepository.save(e);
                return ApiResponse.ok("Đã cập nhật");
            } catch (Exception ex) {
                return ApiResponse.fail("Ngày không hợp lệ");
            }
        }).orElse(ApiResponse.fail("Không tìm thấy"));
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
