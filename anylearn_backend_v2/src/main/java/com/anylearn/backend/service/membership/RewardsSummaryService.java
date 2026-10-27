package com.anylearn.backend.service.membership;

import com.anylearn.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * "Ưu đãi của tôi" (plan 06.5): what the account page gathers in one place besides the anyPoint balance, the tier and
 * the expiry (their own endpoints): the referral code with friends invited and points earned, and the family offer.
 */
@Service
@RequiredArgsConstructor
public class RewardsSummaryService {

    private final JdbcTemplate jdbc;
    private final MembershipSettings settings;

    public Map<String, Object> summary(User user) {
        Long invited = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE user_id = ? AND COALESCE(is_child, 0) = 0", Long.class, user.getId());
        // A friend's order pays the referrer through a commission row that names the friend (ref_user_id); the buyer's own reward has none.
        Long points = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'commission' AND ref_user_id IS NOT NULL AND status IN (0, 1)",
                Long.class, user.getId());
        Map<String, Object> referral = new LinkedHashMap<>();
        referral.put("code", user.getRefcode());
        referral.put("link", "https://anylearn.vn/ref/" + user.getRefcode());
        referral.put("invited", invited == null ? 0 : invited);
        referral.put("pointsEarned", points == null ? 0 : points);

        Map<String, Object> family = new LinkedHashMap<>();
        family.put("enabled", settings.familyEnabled());
        family.put("percent", settings.familyPercent());
        family.put("windowDays", settings.familyWindowDays());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("referral", referral);
        result.put("family", family);
        return result;
    }
}
