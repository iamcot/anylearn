package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/items")
@RequiredArgsConstructor
public class AdminItemController {

    private final ItemRepository itemRepository;
    private final EntityManager em;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    @GetMapping
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer userStatus,
            @RequestParam(required = false) String q) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        var sql = "SELECT i.id, i.title, i.type, i.price, i.status, i.user_status, " +
                  "u.name AS ownerName, u.phone AS ownerPhone, i.created_at " +
                  "FROM items i LEFT JOIN users u ON i.user_id = u.id WHERE 1=1" +
                  (status != null ? " AND i.status=" + status : "") +
                  (userStatus != null ? " AND i.user_status=" + userStatus : "") +
                  (q != null && !q.isBlank() ? " AND i.title LIKE '%" + q.replace("'","''") + "%'" : "") +
                  " ORDER BY i.id DESC LIMIT " + size + " OFFSET " + (long) page * size;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("title", r[1] != null ? r[1] : "");
            m.put("type", r[2] != null ? r[2] : ""); m.put("price", r[3]);
            m.put("status", r[4]); m.put("userStatus", r[5]);
            m.put("ownerName", r[6] != null ? r[6] : ""); m.put("ownerPhone", r[7] != null ? r[7] : "");
            m.put("createdAt", r[8] != null ? r[8].toString() : "");
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", content, "page", page, "size", size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.fail("Not found"));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id).map(item -> {
            if (body.containsKey("title")) item.setTitle((String) body.get("title"));
            if (body.containsKey("status")) item.setStatus(((Number) body.get("status")).byteValue());
            if (body.containsKey("userStatus")) item.setUserStatus(((Number) body.get("userStatus")).byteValue());
            if (body.containsKey("price")) item.setPrice(((Number) body.get("price")).longValue());
            if (body.containsKey("isHot")) item.setIsHot(((Number) body.get("isHot")).byteValue());
            itemRepository.save(item);
            return ApiResponse.ok(item);
        }).orElse(ApiResponse.fail("Not found"));
    }
}
