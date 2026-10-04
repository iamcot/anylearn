package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
            @RequestParam(required = false) String q) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        var sb = new StringBuilder("SELECT u.* FROM users u WHERE 1=1");
        if (role != null && !role.isBlank()) sb.append(" AND u.role = '").append(role.replace("'", "")).append("'");
        if (status != null) sb.append(" AND u.status = ").append(status);
        if (q != null && !q.isBlank()) {
            String safe = q.replace("'", "''");
            sb.append(" AND (u.name LIKE '%").append(safe).append("%'")
              .append(" OR u.phone LIKE '%").append(safe).append("%'")
              .append(" OR u.email LIKE '%").append(safe).append("%')");
        }
        sb.append(" ORDER BY u.id DESC LIMIT ").append(size).append(" OFFSET ").append((long) page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT id,name,phone,email,role,status,image,wallet_m,wallet_c,commission_rate,created_at FROM users u WHERE 1=1" +
                (role != null && !role.isBlank() ? " AND role='" + role.replace("'", "") + "'" : "") +
                (status != null ? " AND status=" + status : "") +
                (q != null && !q.isBlank() ? " AND (name LIKE '%" + q.replace("'","''") + "%' OR phone LIKE '%" + q.replace("'","''") + "%' OR email LIKE '%" + q.replace("'","''") + "%')" : "") +
                " ORDER BY id DESC LIMIT " + size + " OFFSET " + (long) page * size)
                .getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("name", r[1] != null ? r[1] : "");
            m.put("phone", r[2] != null ? r[2] : ""); m.put("email", r[3] != null ? r[3] : "");
            m.put("role", r[4] != null ? r[4] : ""); m.put("status", r[5]);
            m.put("image", r[6] != null ? r[6] : ""); m.put("walletM", r[7]);
            m.put("walletC", r[8]); m.put("commissionRate", r[9]);
            m.put("createdAt", r[10] != null ? r[10].toString() : "");
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", content, "page", page, "size", size));
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
            userRepository.save(u);
            return ApiResponse.ok(u);
        }).orElse(ApiResponse.fail("Not found"));
    }

    private Number toNumber(Object v) {
        return v instanceof Number ? (Number) v : Double.parseDouble(v.toString());
    }
}
