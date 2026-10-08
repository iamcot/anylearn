package com.anylearn.backend.service;

import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final EntityManager em;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public record AuditDiscrepancy(long userId, long walletC, long txSum, long delta) {}

    /**
     * Compare each user's wallet_c against sum of their approved transactions.
     * Returns list of users where the two values don't match.
     */
    // Types that actually affect wallet_c — foundation and net_revenue are accounting-only
    private static final String WALLET_TYPES = "'partner','commission','commission_add','exchange','exchange_refund','withdraw'";

    @SuppressWarnings("unchecked")
    public List<AuditDiscrepancy> runWalletAudit() {
        String sql = """
                SELECT u.id, u.wallet_c,
                       COALESCE(SUM(CASE WHEN t.type IN (%s) THEN t.amount ELSE 0 END), 0) AS tx_sum
                FROM users u
                LEFT JOIN transactions t ON t.user_id = u.id AND t.status = 1
                GROUP BY u.id, u.wallet_c
                HAVING u.wallet_c != COALESCE(SUM(CASE WHEN t.type IN (%s) THEN t.amount ELSE 0 END), 0)
                """.formatted(WALLET_TYPES, WALLET_TYPES);
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        List<AuditDiscrepancy> result = new ArrayList<>();
        for (Object[] r : rows) {
            long userId  = ((Number) r[0]).longValue();
            long walletC = ((Number) r[1]).longValue();
            long txSum   = ((Number) r[2]).longValue();
            result.add(new AuditDiscrepancy(userId, walletC, txSum, walletC - txSum));
        }
        return result;
    }

    /**
     * Run audit and notify all admins if discrepancies are found.
     */
    public void auditAndNotify() {
        List<AuditDiscrepancy> discrepancies = runWalletAudit();
        if (discrepancies.isEmpty()) {
            log.info("[audit] wallet_c reconciliation OK — no discrepancies found");
            return;
        }
        log.warn("[audit] found {} wallet_c discrepancies", discrepancies.size());
        String summary = discrepancies.size() + " user(s) có số dư anyPoint sai lệch. IDs: " +
                discrepancies.stream().map(d -> d.userId() + "(Δ" + d.delta() + ")").toList();

        userRepository.findByRole("admin").forEach(admin -> {
            try {
                notificationService.createNotification(
                        admin.getId(), "system_notif",
                        "Cảnh báo kiểm toán anyPoint",
                        summary,
                        "/admin/transactions", null);
            } catch (Exception e) {
                log.error("[audit] failed to notify admin {}: {}", admin.getId(), e.getMessage());
            }
        });
    }

    /** Daily audit at 3:00 AM */
    @Scheduled(cron = "0 0 8 * * *")
    public void scheduledAudit() {
        log.info("[audit] starting scheduled daily wallet_c reconciliation");
        auditAndNotify();
    }
}
