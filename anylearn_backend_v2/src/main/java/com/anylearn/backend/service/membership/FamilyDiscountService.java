package com.anylearn.backend.service.membership;

import com.anylearn.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Family offer (plan 10.3): looks up the children registered recently and applies {@link FamilyDiscountRules}. */
@Service
@RequiredArgsConstructor
public class FamilyDiscountService {

    private final JdbcTemplate jdbc;
    private final MembershipSettings settings;

    /** Discount in VND per cart line id for this account's cart; empty when switched off. */
    public Map<Long, Long> forCart(User account, List<FamilyDiscountRules.Line> lines) {
        if (!settings.familyEnabled() || lines.stream().noneMatch(FamilyDiscountRules.Line::child)) return Map.of();
        Set<Long> recent = new HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT od.user_id FROM order_details od JOIN orders o ON o.id = od.order_id JOIN users c ON c.id = od.user_id "
                        + "WHERE o.user_id = ? AND c.is_child = 1 AND c.user_id = ? AND od.created_at >= ? AND o.status NOT LIKE 'cancel%' "
                        + "AND o.status NOT IN ('fail', 'refund', 'return_buyer', 'return_seller')",
                Long.class, account.getId(), account.getId(), java.sql.Timestamp.valueOf(LocalDateTime.now().minusDays(settings.familyWindowDays()))));
        return FamilyDiscountRules.discounts(lines, recent, settings.familyPercent());
    }
}
