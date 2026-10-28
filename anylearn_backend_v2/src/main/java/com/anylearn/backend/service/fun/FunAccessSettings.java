package com.anylearn.backend.service.fun;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** `fun/access_{game}` (all / testers / off) and `fun/testers` (phones): the roll-out of each Vui học game. */
@Component
public class FunAccessSettings {

    private final ConfigurationRepository configurationRepository;

    public FunAccessSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public String mode(String game) {
        return FunAccessRules.cleanMode(read("fun/access_" + game).orElse(FunAccessRules.ALL));
    }

    public List<String> testers() {
        return FunAccessRules.parsePhones(read("fun/testers").orElse(""));
    }

    public boolean allowed(String game, User user) {
        if (user == null) return true;
        return FunAccessRules.allowed(mode(game), "admin".equals(user.getRole()), user.getPhone(), testers());
    }

    public Map<String, Boolean> allowedFor(User user) {
        Map<String, Boolean> out = new LinkedHashMap<>();
        for (String g : FunAccessRules.GAMES) out.put(g, allowed(g, user));
        return out;
    }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> modes = new LinkedHashMap<>();
        for (String g : FunAccessRules.GAMES) modes.put(g, mode(g));
        out.put("modes", modes);
        out.put("testers", read("fun/testers").orElse(""));
        out.put("testerCount", testers().size());
        return out;
    }

    public void save(Map<String, Object> body) {
        if (body.get("modes") instanceof Map<?, ?> modes) {
            for (String g : FunAccessRules.GAMES) {
                if (modes.get(g) instanceof String s) write("fun/access_" + g, FunAccessRules.cleanMode(s));
            }
        }
        if (body.get("testers") instanceof String s) write("fun/testers", s);
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
