package com.anylearn.backend.service.quiz;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

/** `quiz/*` rows of the configurations table, edited on the back office page "Kho câu hỏi". */
@Component
public class QuizSettings {

    public static final String KEY_GEN_ENABLED = "quiz/gen_enabled";
    public static final String KEY_TARGET = "quiz/target_per_cell";
    public static final String KEY_BATCH = "quiz/batch_size";
    public static final String KEY_NIGHTLY_BATCHES = "quiz/nightly_batches";
    public static final String KEY_AUTO_APPROVE = "quiz/auto_approve";
    public static final String KEY_RANK_MIX = "quiz/rank_mix";

    private final ConfigurationRepository configurationRepository;

    public QuizSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    /** The nightly top-up costs AI calls, so it is off until the team switches it on. */
    public boolean genEnabled() {
        return "1".equals(read(KEY_GEN_ENABLED).map(String::trim).orElse("0"));
    }

    public int targetPerCell() {
        return number(KEY_TARGET, 300, 20, 5000);
    }

    public int batchSize() {
        return number(KEY_BATCH, 25, 5, 40);
    }

    public int nightlyBatches() {
        return number(KEY_NIGHTLY_BATCHES, 6, 1, 30);
    }

    /** Verified questions go straight to `active` when on; otherwise they wait in the review queue. */
    public boolean autoApprove() {
        return "1".equals(read(KEY_AUTO_APPROVE).map(String::trim).orElse("0"));
    }

    /** Share of each difficulty per rank; the default table until the team saves its own. */
    public java.util.Map<String, int[]> rankMix() {
        java.util.Map<String, int[]> saved = read(KEY_RANK_MIX).map(QuizRules::parseMix).orElse(null);
        return saved != null ? saved : QuizRules.DEFAULT_MIX;
    }

    public void saveRankMix(java.util.Map<String, int[]> mix) {
        write(KEY_RANK_MIX, QuizRules.mixToJson(mix));
    }

    public void save(boolean genEnabled, int target, int batch, int nightlyBatches, boolean autoApprove) {
        write(KEY_GEN_ENABLED, genEnabled ? "1" : "0");
        write(KEY_TARGET, String.valueOf(clamp(target, 20, 5000)));
        write(KEY_BATCH, String.valueOf(clamp(batch, 5, 40)));
        write(KEY_NIGHTLY_BATCHES, String.valueOf(clamp(nightlyBatches, 1, 30)));
        write(KEY_AUTO_APPROVE, autoApprove ? "1" : "0");
    }

    private static int clamp(int value, int min, int max) {
        return Math.min(Math.max(value, min), max);
    }

    private int number(String key, int fallback, int min, int max) {
        try {
            return clamp(Integer.parseInt(read(key).orElse(String.valueOf(fallback)).trim()), min, max);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private Optional<String> read(String key) {
        return configurationRepository.findByKey(key).map(Configuration::getValue).filter(v -> v != null && !v.isBlank());
    }

    private void write(String key, String value) {
        Configuration row = configurationRepository.findByKey(key).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(key);
            created.setType("text");
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(value);
        row.setUpdatedAt(LocalDateTime.now());
        configurationRepository.save(row);
    }
}
