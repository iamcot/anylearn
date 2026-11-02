package com.anylearn.backend.service.zns;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Per template: the Zalo template id (`zns/{key}/template_id`, default = the approved id in {@link ZnsTemplates#DEFS})
 * and an on/off switch (`zns/{key}/enabled`, default on). Rows of `configurations`, edited on the back office page "Mẫu Zalo ZNS".
 */
@Service
@RequiredArgsConstructor
public class ZnsTemplateSettings {

    private static final String CONFIG_TYPE = "text";
    private static final Pattern TEMPLATE_ID = Pattern.compile("\\d{1,15}");

    private final ConfigurationRepository configurationRepository;

    /** The id to send with, or empty when the template is switched off or has no id. */
    public Optional<String> activeTemplateId(String key) {
        if (!enabled(key)) return Optional.empty();
        String id = templateId(key);
        return id.isBlank() ? Optional.empty() : Optional.of(id);
    }

    public String templateId(String key) {
        String fallback = ZnsTemplates.def(key).map(ZnsTemplates.Def::defaultTemplateId).orElse("");
        return read(key + "/template_id").map(String::trim).filter(value -> !value.isEmpty()).orElse(fallback);
    }

    public boolean enabled(String key) {
        return read(key + "/enabled").map(String::trim).map(value -> !"0".equals(value)).orElse(true);
    }

    /** Returns the problem to show, or null when saved. A blank id puts the approved default back. */
    public String save(String key, String templateId, Boolean enabled) {
        if (ZnsTemplates.def(key).isEmpty()) return "Không có mẫu " + key;
        if (templateId != null) {
            String id = templateId.trim();
            if (!id.isEmpty() && !TEMPLATE_ID.matcher(id).matches()) return "Mã mẫu ZNS chỉ gồm chữ số";
            write(key + "/template_id", id);
        }
        if (enabled != null) write(key + "/enabled", enabled ? "1" : "0");
        return null;
    }

    private Optional<String> read(String suffix) {
        return configurationRepository.findByKey("zns/" + suffix).map(Configuration::getValue);
    }

    private void write(String suffix, String value) {
        String key = "zns/" + suffix;
        Configuration row = configurationRepository.findByKey(key).orElseGet(Configuration::new);
        row.setKey(key);
        row.setValue(value);
        if (row.getType() == null) row.setType(CONFIG_TYPE);
        if (row.getCreatedAt() == null) row.setCreatedAt(LocalDateTime.now());
        row.setUpdatedAt(LocalDateTime.now());
        configurationRepository.save(row);
    }
}
