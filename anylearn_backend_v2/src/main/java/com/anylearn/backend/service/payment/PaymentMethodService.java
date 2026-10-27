package com.anylearn.backend.service.payment;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.payment.PaymentMethodRules.Definition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Payment methods the team can switch on and off in the back office. Rows of `configurations`:
 * `payment/{key}/enabled` (default on), `payment/{key}/min`, `payment/{key}/max`, `payment/{key}/label`.
 */
@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final ConfigurationRepository configurationRepository;

    /** Every method with its settings, for the back office. */
    public List<Map<String, Object>> listForAdmin() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Definition d : PaymentMethodRules.DEFINITIONS) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("key", d.key());
            map.put("label", label(d));
            map.put("defaultLabel", d.label());
            map.put("enabled", enabled(d));
            map.put("min", min(d));
            map.put("max", max(d));
            out.add(map);
        }
        return out;
    }

    /** The methods offered for an order total (what the checkout shows). */
    public List<Map<String, Object>> available(long total) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Definition d : PaymentMethodRules.DEFINITIONS) {
            if (!PaymentMethodRules.offered(enabled(d), min(d), max(d), total)) continue;
            out.add(Map.of("value", d.key(), "label", label(d)));
        }
        return out;
    }

    /** True when the method exists and is switched on (the amount range only decides what is shown, since coupons change the total). */
    public boolean isEnabled(String key) {
        return PaymentMethodRules.definition(key).map(this::enabled).orElse(false);
    }

    /** Saves `[{key, enabled, min, max, label}]`. Returns the problem to show, or null when saved. */
    public String save(List<Map<String, Object>> rows) {
        List<Runnable> writes = new ArrayList<>();
        boolean anyEnabled = false;
        for (Map<String, Object> row : rows) {
            Optional<Definition> found = PaymentMethodRules.definition(String.valueOf(row.get("key")));
            if (found.isEmpty()) continue;
            Definition d = found.get();
            boolean enabled = !Boolean.FALSE.equals(row.get("enabled"));
            long min = number(row.get("min"), d.defaultMin());
            long max = number(row.get("max"), d.defaultMax());
            String label = row.get("label") == null ? "" : String.valueOf(row.get("label")).trim();
            String problem = PaymentMethodRules.problem(min, max, d.label());
            if (problem != null) return problem;
            anyEnabled |= enabled;
            writes.add(() -> {
                write("payment/" + d.key() + "/enabled", enabled ? "1" : "0");
                write("payment/" + d.key() + "/min", String.valueOf(min));
                write("payment/" + d.key() + "/max", String.valueOf(max));
                write("payment/" + d.key() + "/label", label);
            });
        }
        if (!anyEnabled) return "Cần bật ít nhất một phương thức thanh toán";
        writes.forEach(Runnable::run);
        return null;
    }

    private boolean enabled(Definition d) {
        return !"0".equals(read("payment/" + d.key() + "/enabled"));
    }

    private long min(Definition d) {
        return number(read("payment/" + d.key() + "/min"), d.defaultMin());
    }

    private long max(Definition d) {
        return number(read("payment/" + d.key() + "/max"), d.defaultMax());
    }

    private String label(Definition d) {
        String saved = read("payment/" + d.key() + "/label");
        return saved == null || saved.isBlank() ? d.label() : saved;
    }

    private static long number(Object value, long fallback) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s && !s.isBlank()) {
            try { return Long.parseLong(s.trim()); } catch (NumberFormatException ignored) { return fallback; }
        }
        return fallback;
    }

    private String read(String key) {
        return configurationRepository.findByKey(key).map(Configuration::getValue).orElse(null);
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
