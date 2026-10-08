package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ArticleRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/articles")
@RequiredArgsConstructor
public class AdminArticleController {

    private final ArticleRepository articleRepository;
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
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String q) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        var conditions =
                  (status != null ? " AND a.status=" + status : "") +
                  (type != null && !type.isBlank() ? " AND a.type='" + type.replace("'","''") + "'" : "") +
                  (q != null && !q.isBlank() ? " AND a.title LIKE '%" + q.replace("'","''") + "%'" : "");

        var sql = "SELECT a.id, a.title, a.type, a.status, a.is_hot, a.view, a.created_at, " +
                  "u.name AS authorName " +
                  "FROM articles a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1" +
                  conditions + " ORDER BY a.id DESC LIMIT " + size + " OFFSET " + (long) page * size;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("title", r[1] != null ? r[1] : "");
            m.put("type", r[2] != null ? r[2] : ""); m.put("status", r[3]);
            m.put("isHot", r[4]); m.put("view", r[5]);
            m.put("createdAt", r[6] != null ? r[6].toString() : "");
            m.put("authorName", r[7] != null ? r[7] : "");
            return m;
        }).toList();

        long total = ((Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM articles a WHERE 1=1" + conditions)
                .getSingleResult()).longValue();

        return ApiResponse.ok(Map.of("content", content, "total", total, "page", page, "size", size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return articleRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.fail("Not found"));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return articleRepository.findById(id).map(a -> {
            if (body.containsKey("title")) a.setTitle((String) body.get("title"));
            if (body.containsKey("shortContent")) a.setShortContent((String) body.get("shortContent"));
            if (body.containsKey("content")) a.setContent((String) body.get("content"));
            if (body.containsKey("status")) a.setStatus(((Number) body.get("status")).byteValue());
            if (body.containsKey("isHot")) a.setIsHot(((Number) body.get("isHot")).byteValue());
            if (body.containsKey("type")) a.setType((String) body.get("type"));
            articleRepository.save(a);
            return ApiResponse.ok(a);
        }).orElse(ApiResponse.fail("Not found"));
    }
}
