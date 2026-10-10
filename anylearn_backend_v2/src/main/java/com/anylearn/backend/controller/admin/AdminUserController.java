package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.MeilisearchService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final EntityManager em;
    private final PasswordEncoder passwordEncoder;
    private final MeilisearchService meilisearchService;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    @GetMapping
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer statusFilter,
            @RequestParam(required = false) Integer isSigned,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "id") String sortBy) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        String safeSort = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        String safeSortCol = "popularityScore".equalsIgnoreCase(sortBy) ? "u.popularity_score" : "u.id";

        var conditions =
                (role != null && !role.isBlank() ? " AND u.role='" + role.replace("'", "") + "'" : "") +
                (status != null ? " AND u.status=" + status : "") +
                (statusFilter != null ? " AND u.status=" + statusFilter : "") +
                (isSigned != null ? " AND u.is_signed=" + isSigned : "") +
                (q != null && !q.isBlank() ? " AND (u.name LIKE '%" + q.replace("'","''") + "%' OR u.phone LIKE '%" + q.replace("'","''") + "%' OR u.email LIKE '%" + q.replace("'","''") + "%')" : "");

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT u.id, u.name, u.phone, u.email, u.role, u.status, u.image, u.wallet_m, u.wallet_c, u.commission_rate, u.created_at, " +
                "u.introduce, u.full_content, u.user_id, ru.name AS refName, u.is_signed, u.popularity_score " +
                "FROM users u LEFT JOIN users ru ON u.user_id = ru.id " +
                "WHERE 1=1" + conditions + " ORDER BY " + safeSortCol + " " + safeSort + " LIMIT " + size + " OFFSET " + (long) page * size)
                .getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("name", r[1] != null ? r[1] : "");
            m.put("phone", r[2] != null ? r[2] : ""); m.put("email", r[3] != null ? r[3] : "");
            m.put("role", r[4] != null ? r[4] : ""); m.put("status", r[5]);
            m.put("image", r[6] != null ? r[6] : ""); m.put("walletM", r[7]);
            m.put("walletC", r[8]); m.put("commissionRate", r[9]);
            m.put("createdAt", r[10] != null ? r[10].toString() : "");
            m.put("introduce", r[11] != null ? r[11] : "");
            m.put("fullContent", r[12] != null ? r[12] : "");
            m.put("refUserId", r[13]);
            m.put("refName", r[14] != null ? r[14] : "");
            m.put("isSigned", r[15]);
            m.put("popularityScore", r[16] != null ? r[16] : 0);
            return m;
        }).toList();

        long total = ((Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM users u LEFT JOIN users ru ON u.user_id = ru.id WHERE 1=1" + conditions)
                .getSingleResult()).longValue();

        return ApiResponse.ok(Map.of("content", content, "total", total, "page", page, "size", size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return userRepository.findById(id)
                .map(u -> ApiResponse.ok(u))
                .orElse(ApiResponse.fail("Not found"));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return userRepository.findById(id).map(u -> {
            if (body.containsKey("name")) u.setName((String) body.get("name"));
            if (body.containsKey("phone")) u.setPhone((String) body.get("phone"));
            if (body.containsKey("email")) u.setEmail((String) body.get("email"));
            if (body.containsKey("role")) u.setRole((String) body.get("role"));
            if (body.containsKey("status")) u.setStatus(toNumber(body.get("status")).byteValue());
            if (body.containsKey("commissionRate")) u.setCommissionRate(toNumber(body.get("commissionRate")).doubleValue());
            if (body.get("image") != null) u.setImage(String.valueOf(body.get("image")));
            if (body.get("introduce") != null) u.setIntroduce(String.valueOf(body.get("introduce")));
            if (body.get("fullContent") != null) u.setFullContent(String.valueOf(body.get("fullContent")));
            userRepository.save(u);
            return ApiResponse.ok(u);
        }).orElse(ApiResponse.fail("Not found"));
    }

    @PostMapping("/{id}/reset-password")
    public ApiResponse<?> resetPassword(@AuthenticationPrincipal User admin,
            @PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (!isAdmin(admin)) return ApiResponse.fail("Forbidden");
        return userRepository.findById(id).map(user -> {
            String newPassword;
            Object pw = body != null ? body.get("password") : null;
            if (pw != null && !String.valueOf(pw).isBlank()) {
                newPassword = String.valueOf(pw);
            } else {
                // auto-generate 8 chars: letters + digits
                String chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
                StringBuilder sb = new StringBuilder();
                java.util.Random rng = new java.util.Random();
                for (int i = 0; i < 8; i++) sb.append(chars.charAt(rng.nextInt(chars.length())));
                newPassword = sb.toString();
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ApiResponse.ok(Map.of("newPassword", newPassword));
        }).orElse(ApiResponse.fail("User not found"));
    }

    @PutMapping("/{id}/toggle-signed")
    public ApiResponse<?> toggleSigned(@AuthenticationPrincipal User admin, @PathVariable Long id) {
        if (!isAdmin(admin)) return ApiResponse.fail("Forbidden");
        return userRepository.findById(id).map(user -> {
            byte newVal = (byte)(user.getIsSigned() != null && user.getIsSigned() == 1 ? 0 : 1);
            user.setIsSigned(newVal);
            userRepository.save(user);
            meilisearchService.indexUser(id);
            return ApiResponse.ok(Map.of("isSigned", newVal));
        }).orElse(ApiResponse.fail("Not found"));
    }

    private Number toNumber(Object v) {
        return v instanceof Number ? (Number) v : Double.parseDouble(v.toString());
    }
}
