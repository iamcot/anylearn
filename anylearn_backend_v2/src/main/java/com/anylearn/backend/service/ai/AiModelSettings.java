package com.anylearn.backend.service.ai;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Which Anthropic model each AI feature uses: rows `ai/model/{feature}` of the configurations table, falling back to `app.ai.model`. */
@Component
public class AiModelSettings {

    public static final List<String> FEATURES = List.of(AiUsageService.SUGGEST, AiUsageService.COMPARE, AiUsageService.QUIZ_WRITE, AiUsageService.QUIZ_VERIFY, AiUsageService.LANDING_INTRO);

    private final ConfigurationRepository configurationRepository;
    private final String defaultModel;

    public AiModelSettings(ConfigurationRepository configurationRepository, @Value("${app.ai.model:claude-haiku-5-5}") String defaultModel) {
        this.configurationRepository = configurationRepository;
        this.defaultModel = defaultModel;
    }

    private static String key(String feature) {
        return "ai/model/" + feature;
    }

    public String defaultModel() {
        return defaultModel;
    }

    /** The model of a feature: the saved one when it is still in the price list, else the default from the configuration file. */
    public String modelFor(String feature) {
        return configurationRepository.findByKey(key(feature)).map(Configuration::getValue)
                .map(String::trim).filter(AiPricing.MODELS::contains).orElse(defaultModel);
    }

    /** `{feature: model}` for every feature. */
    public Map<String, String> current() {
        Map<String, String> out = new LinkedHashMap<>();
        for (String f : FEATURES) out.put(f, modelFor(f));
        return out;
    }

    /** Saves the picks; throws on an unknown feature or a model that is not in the list. A blank model goes back to the default. */
    public void save(Map<String, String> picks) {
        for (Map.Entry<String, String> e : picks.entrySet()) {
            if (!FEATURES.contains(e.getKey())) throw new IllegalArgumentException("Tính năng không hợp lệ: " + e.getKey());
            String model = e.getValue() == null ? "" : e.getValue().trim();
            if (!model.isEmpty() && !AiPricing.MODELS.contains(model)) throw new IllegalArgumentException("Mô hình không hợp lệ: " + model);
        }
        for (Map.Entry<String, String> e : picks.entrySet()) {
            String model = e.getValue() == null ? "" : e.getValue().trim();
            Configuration row = configurationRepository.findByKey(key(e.getKey())).orElseGet(() -> {
                Configuration created = new Configuration();
                created.setKey(key(e.getKey()));
                created.setType("text");
                created.setCreatedAt(LocalDateTime.now());
                return created;
            });
            row.setValue(model);
            row.setUpdatedAt(LocalDateTime.now());
            configurationRepository.save(row);
        }
    }
}
