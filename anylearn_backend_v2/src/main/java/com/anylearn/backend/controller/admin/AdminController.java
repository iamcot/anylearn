package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.AuthService;
import com.anylearn.backend.service.AuditService;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.ZnsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.anylearn.backend.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManager;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MeilisearchService meilisearchService;
    private final ZnsService znsService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final ConfigurationRepository configurationRepository;
    private final CategoryRepository categoryRepository;
    private final AuditService auditService;
    private final EntityManager em;

    /** All categories regardless of status — for admin item editing */
    @GetMapping("/categories")
    public ApiResponse<?> allCategories(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(categoryRepository.findAll().stream()
                .sorted(java.util.Comparator.comparingLong(c -> c.getId()))
                .toList());
    }

    /** All partners/schools — loaded once for partner select dropdown */
    @GetMapping("/partners")
    public ApiResponse<?> allPartners(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
            "SELECT id, name, phone FROM users WHERE role IN ('school','partner','teacher') ORDER BY name ASC LIMIT 1000"
        ).getResultList();
        var result = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("name", r[1] != null ? r[1] : ""); m.put("phone", r[2] != null ? r[2] : "");
            return m;
        }).toList();
        return ApiResponse.ok(result);
    }

    @PostMapping("/login")
    public ApiResponse<?> login(@RequestBody Map<String, String> body) {
        try {
            var response = authService.login(body.get("phone"), body.get("password"));
            if (!"admin".equals(response.getRole())) {
                return ApiResponse.fail("Forbidden: không có quyền admin");
            }
            return ApiResponse.ok(response);
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/reindex")
    public ApiResponse<?> reindex(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        meilisearchService.reindexAll();
        return ApiResponse.ok("Reindex complete");
    }

    @PostMapping("/reindex/users")
    public ApiResponse<?> reindexUsers(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        meilisearchService.reindexAllUsers();
        return ApiResponse.ok("User reindex complete");
    }

    @GetMapping("/zns/authorize")
    public ApiResponse<?> znsAuthorize(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("url", znsService.getAuthorizeUrl()));
    }

    @GetMapping("/zns/callback")
    public ApiResponse<?> znsCallback(@RequestParam String code) {
        try {
            znsService.exchangeCodeForToken(code);
            return ApiResponse.ok("ZNS token saved successfully.");
        } catch (Exception e) {
            return ApiResponse.fail("Token exchange failed: " + e.getMessage());
        }
    }

    /**
     * Send in-app notification to a user by phone number.
     * Body: { phone, type, title, content, route?, extraContent? }
     * type "system_notif" is the standard broadcast type.
     */
    @PostMapping("/notification/send")
    public ApiResponse<?> sendNotification(@AuthenticationPrincipal User admin,
                                            @RequestBody Map<String, String> body) {
        if (admin == null || !"admin".equals(admin.getRole())) return ApiResponse.fail("Forbidden");

        String phone = body.get("phone");
        String type = body.getOrDefault("type", "system_notif");
        String title = body.get("title");
        String content = body.get("content");
        String route = body.get("route");
        String extraContent = body.get("extraContent");

        if (phone == null || content == null) {
            return ApiResponse.fail("phone và content là bắt buộc.");
        }

        var targetUser = userRepository.findByPhone(phone).orElse(null);
        if (targetUser == null) {
            return ApiResponse.fail("Không tìm thấy user với SĐT: " + phone);
        }

        var notif = notificationService.createNotification(targetUser.getId(), type, title, content, route, extraContent);
        return ApiResponse.ok(Map.of("notificationId", notif.getId(), "userId", targetUser.getId()));
    }

    @GetMapping("/config")
    public ApiResponse<?> getConfig(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(configurationRepository.findAll());
    }

    @PutMapping("/config/{key}")
    public ApiResponse<?> updateConfig(
            @AuthenticationPrincipal User user,
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return configurationRepository.findById(key).map(c -> {
            c.setValue(body.get("value"));
            configurationRepository.save(c);
            return ApiResponse.ok(c);
        }).orElse(ApiResponse.fail("Config key not found: " + key));
    }

    /** Run wallet_c reconciliation audit. Returns list of discrepancies. */
    @PostMapping("/audit/run")
    public ApiResponse<?> auditRun(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        var discrepancies = auditService.runWalletAudit();
        return ApiResponse.ok(Map.of(
                "total", discrepancies.size(),
                "items", discrepancies.stream().map(d -> Map.of(
                        "userId", d.userId(), "walletC", d.walletC(),
                        "txSum", d.txSum(), "delta", d.delta()
                )).toList()
        ));
    }

    /**
     * GET /admin/finance/summary
     * Financial overview: partner obligations, user wallets, foundation fund, company revenue.
     */
    @GetMapping("/finance/summary")
    public ApiResponse<?> financeSummary(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");

        // Partner/school/teacher wallets — points the company owes them (not yet withdrawn)
        Number partnerWalletC = (Number) em.createNativeQuery(
                "SELECT COALESCE(SUM(wallet_c),0) FROM users WHERE role IN ('school','partner','teacher')")
                .getSingleResult();

        // Student/buyer wallets — points in circulation (earned but not spent)
        Number userWalletC = (Number) em.createNativeQuery(
                "SELECT COALESCE(SUM(wallet_c),0) FROM users WHERE role NOT IN ('school','partner','teacher','admin')")
                .getSingleResult();

        // Foundation fund — accumulated approved anyPoints (accounting)
        Number foundationPoints = (Number) em.createNativeQuery(
                "SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='foundation' AND status=1")
                .getSingleResult();

        // Company net revenue — VND retained from completed orders
        Number companyRevenueVnd = (Number) em.createNativeQuery(
                "SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='net_revenue' AND status=1")
                .getSingleResult();

        // Pending points not yet approved (still waiting for order confirmation)
        Number pendingPoints = (Number) em.createNativeQuery(
                "SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type IN ('partner','commission') AND status=0")
                .getSingleResult();

        // Total wallet_c in the whole system
        Number totalWalletC = (Number) em.createNativeQuery(
                "SELECT COALESCE(SUM(wallet_c),0) FROM users")
                .getSingleResult();

        return ApiResponse.ok(Map.of(
                "partnerWalletC",    partnerWalletC.longValue(),
                "userWalletC",       userWalletC.longValue(),
                "totalWalletC",      totalWalletC.longValue(),
                "foundationPoints",  foundationPoints.longValue(),
                "companyRevenueVnd", companyRevenueVnd.longValue(),
                "pendingPoints",     pendingPoints.longValue()
        ));
    }

    /**
     * GET /admin/finance/revenue
     * Revenue history per order line (net_revenue transactions).
     * Params: from/to YYYY-MM-DD, status 0|1, page, size
     */
    @GetMapping("/finance/revenue")
    public ApiResponse<?> financeRevenue(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");

        var where = buildRevenueWhere(from, to, status);

        @SuppressWarnings("unchecked")
        java.util.List<Object[]> rows = em.createNativeQuery(
            "SELECT t.id, t.amount, t.status, t.created_at, " +
            "       od.order_id, od.paid_price, i.title " +
            "FROM transactions t " +
            "JOIN order_details od ON t.order_id = od.id " +
            "JOIN orders o ON od.order_id = o.id " +
            "JOIN items i ON od.item_id = i.id " +
            "WHERE t.type = 'net_revenue'" +
            " AND o.status NOT IN ('cancel_buyer','cancel_system','cancel_seller','return_buyer','return_seller','refund')" +
            where +
            " ORDER BY t.id DESC LIMIT " + size + " OFFSET " + (long) page * size
        ).getResultList();

        var content = rows.stream().map(r -> {
            var m = new java.util.LinkedHashMap<String, Object>();
            m.put("txId",          r[0]);
            m.put("netRevenueVnd", r[1]);
            m.put("status",        r[2]);
            m.put("createdAt",     r[3] != null ? r[3].toString() : null);
            m.put("orderId",       r[4]);
            m.put("paidPrice",     r[5]);
            m.put("itemTitle",     r[6] != null ? r[6] : "");
            return m;
        }).toList();

        Number total = (Number) em.createNativeQuery(
            "SELECT COUNT(*) FROM transactions t " +
            "JOIN order_details od ON t.order_id = od.id " +
            "JOIN orders o ON od.order_id = o.id " +
            "WHERE t.type = 'net_revenue'" +
            " AND o.status NOT IN ('cancel_buyer','cancel_system','cancel_seller','return_buyer','return_seller','refund')" +
            where
        ).getSingleResult();

        return ApiResponse.ok(Map.of("content", content, "total", total.longValue(), "page", page, "size", size));
    }

    private String buildRevenueWhere(String from, String to, Integer status) {
        var sb = new StringBuilder();
        if (from != null && !from.isBlank()) sb.append(" AND t.created_at >= '").append(from).append(" 00:00:00'");
        if (to   != null && !to.isBlank())   sb.append(" AND t.created_at <= '").append(to).append(" 23:59:59'");
        if (status != null)                  sb.append(" AND t.status = ").append(status);
        return sb.toString();
    }
}
