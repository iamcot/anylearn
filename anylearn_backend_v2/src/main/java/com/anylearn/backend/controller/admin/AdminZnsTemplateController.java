package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.ZnsService;
import com.anylearn.backend.service.zns.ZnsNotifier;
import com.anylearn.backend.service.zns.ZnsTemplateSettings;
import com.anylearn.backend.service.zns.ZnsTemplates;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Back office page "Mẫu Zalo ZNS": template ids, switches, a test send and the log of zns_messages. */
@RestController
@RequestMapping("/admin/zns")
@RequiredArgsConstructor
public class AdminZnsTemplateController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ZnsTemplateSettings settings;
    private final ZnsNotifier notifier;
    private final ZnsService znsService;
    private final JdbcTemplate jdbc;

    @org.springframework.beans.factory.annotation.Value("${zalo.zns.testPhone:}")
    private String testPhone;

    @GetMapping("/templates")
    public ApiResponse<?> templates(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(view());
    }

    @PutMapping("/templates")
    public ApiResponse<?> save(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("templates") instanceof List<?> rows)) return ApiResponse.fail("Thiếu danh sách mẫu");
        for (Object raw : rows) {
            if (!(raw instanceof Map<?, ?> row)) continue;
            String key = String.valueOf(row.get("key"));
            String templateId = row.containsKey("templateId") && row.get("templateId") != null ? String.valueOf(row.get("templateId")) : null;
            Boolean enabled = row.get("enabled") instanceof Boolean flag ? flag : null;
            String problem = settings.save(key, templateId, enabled);
            if (problem != null) return ApiResponse.fail(problem);
        }
        return ApiResponse.ok(view());
    }

    /** Sends the template with sample data in development mode to `phone` of the body, else `zalo.zns.testPhone`, else the admin's phone. */
    @PostMapping("/templates/{key}/test")
    public ApiResponse<?> test(@AuthenticationPrincipal User user, @PathVariable String key,
                               @RequestBody(required = false) Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String phone = body != null && body.get("phone") instanceof String typed && !typed.isBlank() ? typed.trim()
                : testPhone != null && !testPhone.isBlank() ? testPhone.trim() : user.getPhone();
        String error = notifier.sendTest(user.getId(), phone, key);
        if (error != null) return ApiResponse.fail(error);
        return ApiResponse.ok(Map.of("phone", phone, "stub", !znsService.isConfigured()));
    }

    @GetMapping("/messages")
    public ApiResponse<?> messages(@AuthenticationPrincipal User user,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size,
                                   @RequestParam(required = false) String template,
                                   @RequestParam(required = false) String status) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        int pageSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> args = new ArrayList<>();
        if (template != null && !template.isBlank()) { where.append(" AND m.template_key = ?"); args.add(template); }
        if (status != null && !status.isBlank()) { where.append(" AND m.status = ?"); args.add(status); }
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM zns_messages m" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(pageSize);
        pageArgs.add(Math.max(page, 0) * pageSize);
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT m.id, m.user_id AS userId, u.name AS userName, m.phone, m.template_key AS templateKey,
                       m.template_id AS templateId, m.dedup_key AS dedupKey, m.template_data AS templateData, m.status,
                       m.error, m.created_at AS createdAt, m.sent_at AS sentAt
                FROM zns_messages m LEFT JOIN users u ON u.id = m.user_id""" + where + " ORDER BY m.id DESC LIMIT ? OFFSET ?",
                pageArgs.toArray());
        return ApiResponse.ok(Map.of("total", total == null ? 0 : total, "items", rows));
    }

    private Map<String, Object> view() {
        Map<String, Map<String, Object>> counts = new LinkedHashMap<>();
        jdbc.queryForList("""
                SELECT template_key, status, COUNT(*) AS n FROM zns_messages
                WHERE created_at >= NOW() - INTERVAL 7 DAY AND dedup_key NOT LIKE 'test:%'
                GROUP BY template_key, status""").forEach(row ->
                counts.computeIfAbsent(String.valueOf(row.get("template_key")), k -> new LinkedHashMap<>())
                        .put(String.valueOf(row.get("status")), row.get("n")));
        List<Map<String, Object>> list = new ArrayList<>();
        for (ZnsTemplates.Def def : ZnsTemplates.DEFS) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", def.key());
            row.put("label", def.label());
            row.put("when", def.when());
            row.put("templateId", settings.templateId(def.key()));
            row.put("defaultTemplateId", def.defaultTemplateId());
            row.put("enabled", settings.enabled(def.key()));
            row.put("params", def.params());
            row.put("sample", def.sample());
            row.put("last7Days", counts.getOrDefault(def.key(), Map.of()));
            list.add(row);
        }
        return Map.of("configured", znsService.isConfigured(), "testPhone", testPhone == null ? "" : testPhone.trim(), "templates", list);
    }

    private static boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
