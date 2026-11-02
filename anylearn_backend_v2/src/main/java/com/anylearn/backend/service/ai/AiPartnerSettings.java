package com.anylearn.backend.service.ai;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** The daily token cap of the partner AI gateway: row `ai/partner_daily_tokens` of configurations (0 = gateway off). */
@Component
@RequiredArgsConstructor
public class AiPartnerSettings {

    public static final String KEY_DAILY_TOKENS = "ai/partner_daily_tokens";
    public static final long MAX_DAILY_TOKENS = 100_000_000;

    private final ConfigurationRepository configurationRepository;

    public long dailyTokens() {
        return configurationRepository.findByKey(KEY_DAILY_TOKENS).map(Configuration::getValue)
                .map(String::trim).filter(v -> v.matches("\\d{1,12}")).map(Long::parseLong)
                .orElse(AiGatewayRules.DEFAULT_DAILY_TOKENS);
    }

    public void saveDailyTokens(long tokens) {
        if (tokens < 0 || tokens > MAX_DAILY_TOKENS) throw new IllegalArgumentException("Trần token phải từ 0 đến " + MAX_DAILY_TOKENS + ".");
        Configuration row = configurationRepository.findByKey(KEY_DAILY_TOKENS).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(KEY_DAILY_TOKENS);
            created.setType("text");
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(String.valueOf(tokens));
        row.setUpdatedAt(LocalDateTime.now());
        configurationRepository.save(row);
    }
}
