package com.anylearn.backend.service;

import com.anylearn.backend.entity.AuditRun;
import com.anylearn.backend.entity.AuditRunDetail;
import com.anylearn.backend.repository.AuditRunDetailRepository;
import com.anylearn.backend.repository.AuditRunRepository;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
    private final AuditRunRepository auditRunRepository;
    private final AuditRunDetailRepository auditRunDetailRepository;

    public record AuditDiscrepancy(long userId, long walletC, long txSum, long delta) {}

    // Types that actually affect wallet_c:
    //   exchange (-) + exchange_refund (+) net to 0 when order cancelled — both stay status=1
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
     * Run audit, persist a run log + detail rows, and notify admins if discrepancies found.
     */
    public AuditRun auditAndNotify(String triggeredBy) {
        LocalDateTime now = LocalDateTime.now();
        List<AuditDiscrepancy> discrepancies = runWalletAudit();

        // Persist run record
        AuditRun run = new AuditRun();
        run.setRanAt(now);
        run.setTriggeredBy(triggeredBy);
        run.setDiscrepancyCount(discrepancies.size());
        run.setStatus(discrepancies.isEmpty() ? "ok" : "warning");
        run.setCreatedAt(now);
        auditRunRepository.save(run);

        // Persist detail rows
        for (AuditDiscrepancy d : discrepancies) {
            AuditRunDetail detail = new AuditRunDetail();
            detail.setRunId(run.getId());
            detail.setUserId(d.userId());
            detail.setWalletC(d.walletC());
            detail.setTxSum(d.txSum());
            detail.setDelta(d.delta());
            auditRunDetailRepository.save(detail);
        }

        if (discrepancies.isEmpty()) {
            log.info("[audit] wallet_c reconciliation OK — no discrepancies found");
            return run;
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

        return run;
    }

    /** Fetch recent audit runs (newest first), with their detail rows. */
    public List<Map<String, Object>> getRecentRuns(int limit) {
        return auditRunRepository
                .findAllByOrderByRanAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(run -> {
                    List<Map<String, Object>> details = auditRunDetailRepository.findByRunId(run.getId())
                            .stream()
                            .map(d -> Map.<String, Object>of(
                                    "userId", d.getUserId(),
                                    "walletC", d.getWalletC(),
                                    "txSum", d.getTxSum(),
                                    "delta", d.getDelta()
                            ))
                            .toList();
                    return Map.<String, Object>of(
                            "id", run.getId(),
                            "ranAt", run.getRanAt().toString(),
                            "triggeredBy", run.getTriggeredBy(),
                            "discrepancyCount", run.getDiscrepancyCount(),
                            "status", run.getStatus(),
                            "details", details
                    );
                })
                .toList();
    }

    /** Daily audit at 8:00 AM */
    @Scheduled(cron = "0 0 8 * * *")
    public void scheduledAudit() {
        log.info("[audit] starting scheduled daily wallet_c reconciliation");
        auditAndNotify("scheduled");
    }
}
