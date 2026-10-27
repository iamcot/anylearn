package com.anylearn.backend.service.reviews;

import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Reads the `review/*` rows of the configurations table; each one falls back to a default. */
@Component
public class ReviewSettings {

    public static final String KEY_POINTS_TEXT = "review/points_text";
    public static final String KEY_POINTS_MEDIA = "review/points_media";
    public static final String KEY_REMIND_ENABLED = "review/remind_enabled";

    public static final String KEY_TOP_RATED_DAYS = "review/top_rated_days";

    private final ConfigurationRepository configurationRepository;

    public ReviewSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public int pointsForText() {
        return ReviewRewardRules.configured(read(KEY_POINTS_TEXT).orElse(null), ReviewRewardRules.DEFAULT_TEXT_POINTS);
    }

    public int pointsForMedia() {
        return ReviewRewardRules.configured(read(KEY_POINTS_MEDIA).orElse(null), ReviewRewardRules.DEFAULT_MEDIA_POINTS);
    }

    public int topRatedDays() {
        return TopRatedRules.days(read(KEY_TOP_RATED_DAYS).orElse(null));
    }

    public boolean remindEnabled() {
        return !read(KEY_REMIND_ENABLED).map(String::trim).filter("0"::equals).isPresent();
    }

    private Optional<String> read(String key) {
        return configurationRepository.findByKey(key).map(row -> row.getValue()).filter(value -> value != null && !value.isBlank());
    }
}
