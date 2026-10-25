package com.anylearn.backend.service.points;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Resolves the commission settings of one item (global config, the item's own overrides, the author's rate).
 * The order creation and the "points you will earn" preview both start here, so they cannot drift apart.
 */
@Component
@RequiredArgsConstructor
public class ItemPointsResolver {

    private final ConfigurationRepository configurationRepository;
    private final UserRepository userRepository;
    private final PointsEngine pointsEngine;

    public record ItemPoints(CommissionConfig config, double commissionRate, User author) {}

    public ItemPoints resolve(Item item) {
        Map<String, String> configMap = new HashMap<>();
        configurationRepository.findAll().forEach(c -> configMap.put(c.getKey(), c.getValue()));
        CommissionConfig config = pointsEngine.mergeCompanyCommission(CommissionConfig.fromMap(configMap), item.getCompanyCommission());

        User author = item.getUserId() != null ? userRepository.findById(item.getUserId()).orElse(null) : null;
        double commissionRate = pointsEngine.resolveCommissionRate(
                item.getCommissionRate(),
                author != null ? author.getCommissionRate() : null,
                config.commission());
        return new ItemPoints(config, commissionRate, author);
    }

    public record BuyerPointsPreview(long points, long vndValue) {}

    /** What the buyer earns for the item at its current price; the buyer's share does not depend on referral chains. */
    public BuyerPointsPreview buyerPointsPreview(Item item) {
        long price = item.getPrice() != null ? item.getPrice() : 0L;
        ItemPoints resolved = resolve(item);
        long points = pointsEngine.calculate(price, resolved.commissionRate(), resolved.config(), 0, false).buyerPoints();
        return new BuyerPointsPreview(points, Math.round(points * resolved.config().bonusRate()));
    }

    public long buyerPoints(Item item) {
        return buyerPointsPreview(item).points();
    }
}
