package com.anylearn.backend.service.order;

import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/** Reads the `order/*` rows of the configurations table; each one falls back to a default. */
@Component
public class OrderFollowUpSettings {

    public static final String KEY_REMIND_HOURS = "order/remind_hours";
    public static final String KEY_AUTO_CANCEL_HOURS = "order/auto_cancel_hours";
    public static final String KEY_AUTO_CANCEL_ENABLED = "order/auto_cancel_enabled";

    private final ConfigurationRepository configurationRepository;

    public OrderFollowUpSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public List<Integer> remindHours() {
        return PendingOrderRules.parseRemindHours(read(KEY_REMIND_HOURS).orElse(null));
    }

    public int autoCancelHours() {
        return read(KEY_AUTO_CANCEL_HOURS).map(String::trim).map(value -> {
            try {
                int hours = Integer.parseInt(value);
                return hours > 0 ? hours : PendingOrderRules.DEFAULT_AUTO_CANCEL_HOURS;
            } catch (NumberFormatException e) {
                return PendingOrderRules.DEFAULT_AUTO_CANCEL_HOURS;
            }
        }).orElse(PendingOrderRules.DEFAULT_AUTO_CANCEL_HOURS);
    }

    public boolean autoCancelEnabled() {
        return !read(KEY_AUTO_CANCEL_ENABLED).map(String::trim).filter("0"::equals).isPresent();
    }

    private Optional<String> read(String key) {
        return configurationRepository.findByKey(key).map(row -> row.getValue()).filter(value -> value != null && !value.isBlank());
    }
}
