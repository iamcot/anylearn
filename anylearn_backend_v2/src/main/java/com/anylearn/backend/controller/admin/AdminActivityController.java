package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemActivityRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/activities")
@RequiredArgsConstructor
public class AdminActivityController {

    private final EntityManager em;
    private final ItemActivityRepository itemActivityRepository;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    @GetMapping
    @SuppressWarnings("unchecked")
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {

        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (type != null && !type.isBlank())
            where.append(" AND ia.type = '").append(type.replace("'", "")).append("'");
        if (search != null && !search.isBlank()) {
            String s = search.replace("'", "").replace("%", "");
            where.append(" AND (u.name LIKE '%").append(s).append("%' OR u.phone LIKE '%").append(s).append("%')");
        }
        if (partnerId != null)
            where.append(" AND i.user_id = ").append(partnerId);

        List<Object[]> rows = em.createNativeQuery("""
                SELECT ia.id, ia.item_id, i.title AS item_title,
                       ia.user_id, u.name AS user_name, u.phone AS user_phone,
                       ia.type, ia.date, ia.note, ia.status, ia.created_at,
                       pu.name AS partner_name
                FROM item_activities ia
                JOIN items i ON i.id = ia.item_id
                JOIN users u ON u.id = ia.user_id
                JOIN users pu ON pu.id = i.user_id
                """ + where + """
                ORDER BY ia.created_at DESC
                LIMIT ?1 OFFSET ?2
                """)
                .setParameter(1, size)
                .setParameter(2, page * size)
                .getResultList();

        var data = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("itemId", r[1]); m.put("itemTitle", r[2] != null ? r[2] : "");
            m.put("userId", r[3]); m.put("userName", r[4] != null ? r[4] : ""); m.put("userPhone", r[5] != null ? r[5] : "");
            m.put("trialType", r[6] != null ? r[6] : "");
            m.put("trialDate", r[7] != null ? r[7] : "");
            m.put("trialNote", r[8] != null ? r[8] : "");
            m.put("status", r[9]);
            m.put("createdAt", r[10] != null ? r[10].toString() : "");
            m.put("partnerName", r[11] != null ? r[11] : "");
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", data, "page", page, "size", size));
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<?> approve(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemActivityRepository.findById(id).map(ia -> {
            ia.setStatus((byte) 1);
            ia.setUpdatedAt(LocalDateTime.now());
            itemActivityRepository.save(ia);
            return ApiResponse.ok("Đã duyệt");
        }).orElse(ApiResponse.fail("Không tìm thấy"));
    }
}
