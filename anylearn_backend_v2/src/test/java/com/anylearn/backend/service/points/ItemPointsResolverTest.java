package com.anylearn.backend.service.points;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// The points shown before buying must be the buyer points the order creation computes for the same item.
class ItemPointsResolverTest {

    private ConfigurationRepository configs;
    private UserRepository users;
    private final PointsEngine engine = new PointsEngine();
    private ItemPointsResolver resolver;

    @BeforeEach
    void setUp() {
        configs = mock(ConfigurationRepository.class);
        users = mock(UserRepository.class);
        when(configs.findAll()).thenReturn(List.of());
        resolver = new ItemPointsResolver(configs, users, engine);
    }

    private static Item item(long price, Double commissionRate, String companyCommission) {
        Item item = new Item();
        item.setUserId(7L);
        item.setPrice(price);
        item.setCommissionRate(commissionRate);
        item.setCompanyCommission(companyCommission);
        return item;
    }

    private void author(Double commissionRate) {
        User author = new User();
        author.setId(7L);
        author.setCommissionRate(commissionRate);
        when(users.findById(7L)).thenReturn(Optional.of(author));
    }

    private long buyerPointsLikeOrderCreation(Item item) {
        ItemPointsResolver.ItemPoints resolved = resolver.resolve(item);
        return engine.calculate(item.getPrice(), resolved.commissionRate(), resolved.config(), 2, true).buyerPoints();
    }

    @Test
    void previewMatchesOrderCreationWithDefaults() {
        author(0.20);
        Item item = item(1_000_000L, null, null);
        var preview = resolver.buyerPointsPreview(item);
        assertThat(preview.points()).isEqualTo(buyerPointsLikeOrderCreation(item)).isEqualTo(80);
        assertThat(preview.vndValue()).isEqualTo(80_000);
    }

    @Test
    void previewFollowsItemCommissionAndCompanyOverrides() {
        author(0.20);
        Item item = item(2_000_000L, 0.30, "{\"discount\":0.2}");
        assertThat(resolver.buyerPoints(item)).isEqualTo(buyerPointsLikeOrderCreation(item)).isEqualTo(280);
    }

    @Test
    void previewUsesTheConfiguredPointValue() {
        author(0.20);
        Configuration rate = new Configuration();
        rate.setKey("bonus_rate");
        rate.setValue("500");
        when(configs.findAll()).thenReturn(List.of(rate));
        var preview = resolver.buyerPointsPreview(item(1_000_000L, null, null));
        assertThat(preview.points()).isEqualTo(160);
        assertThat(preview.vndValue()).isEqualTo(80_000);
    }

    @Test
    void noPointsWhenCommissionsAreDisabledOrFree() {
        author(0.20);
        assertThat(resolver.buyerPoints(item(1_000_000L, -1.0, null))).isZero();
        assertThat(resolver.buyerPoints(item(0L, null, null))).isZero();
    }
}
