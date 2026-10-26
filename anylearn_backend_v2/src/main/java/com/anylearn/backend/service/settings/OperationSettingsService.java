package com.anylearn.backend.service.settings;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.order.OrderFollowUpSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The few numbers the team may change without a developer: how far "Gần tôi" reaches and when unpaid orders are
 * reminded and cancelled. They are rows of the `configurations` table; a missing row means the default.
 */
@Service
@RequiredArgsConstructor
public class OperationSettingsService {

    public static final String KEY_NEAR_RADIUS_KM = "search/near_radius_km";
    private static final String CONFIG_TYPE = "text";

    private final ConfigurationRepository configurationRepository;
    private final OrderFollowUpSettings orderSettings;

    public int nearRadiusKm() {
        return SettingsRules.nearRadiusKm(configurationRepository.findByKey(KEY_NEAR_RADIUS_KM).map(Configuration::getValue).orElse(null));
    }

    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("nearRadiusKm", nearRadiusKm());
        map.put("remindHours", orderSettings.remindHours());
        map.put("autoCancelHours", orderSettings.autoCancelHours());
        map.put("autoCancelEnabled", orderSettings.autoCancelEnabled());
        return map;
    }

    /** Saves what was sent (only the fields present). Returns the problem to show, or null when everything was saved. */
    public String save(Map<String, Object> body) {
        Integer radius = integer(body.get("nearRadiusKm"));
        if (body.containsKey("nearRadiusKm")) {
            String problem = SettingsRules.nearRadiusProblem(radius);
            if (problem != null) return problem;
        }
        List<Integer> remind = body.get("remindHours") instanceof List<?> list
                ? list.stream().map(OperationSettingsService::integer).collect(Collectors.toList()) : null;
        if (body.containsKey("remindHours")) {
            String problem = SettingsRules.remindHoursProblem(remind);
            if (problem != null) return problem;
        }
        Integer cancelHours = integer(body.get("autoCancelHours"));
        if (body.containsKey("autoCancelHours")) {
            String problem = SettingsRules.hoursProblem(cancelHours, "Thời gian tự hủy đơn");
            if (problem != null) return problem;
        }

        if (body.containsKey("nearRadiusKm")) write(KEY_NEAR_RADIUS_KM, String.valueOf(radius));
        if (body.containsKey("remindHours")) write(OrderFollowUpSettings.KEY_REMIND_HOURS, remind.stream().map(String::valueOf).collect(Collectors.joining(",")));
        if (body.containsKey("autoCancelHours")) write(OrderFollowUpSettings.KEY_AUTO_CANCEL_HOURS, String.valueOf(cancelHours));
        if (body.get("autoCancelEnabled") instanceof Boolean enabled) write(OrderFollowUpSettings.KEY_AUTO_CANCEL_ENABLED, enabled ? "1" : "0");
        return null;
    }

    private static Integer integer(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private void write(String key, String value) {
        Configuration row = configurationRepository.findByKey(key).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(key);
            created.setType(CONFIG_TYPE);
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(value);
        row.setUpdatedAt(LocalDateTime.now());
        configurationRepository.save(row);
    }
}
