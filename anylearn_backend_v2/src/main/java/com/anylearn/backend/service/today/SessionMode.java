package com.anylearn.backend.service.today;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SessionMode {
    ONLINE("online"),
    ONSITE("onsite"),
    EXTRA("extra");

    private final String code;

    SessionMode(String code) {
        this.code = code;
    }

    @JsonValue
    public String code() {
        return code;
    }

    public static SessionMode of(String itemSubtype) {
        if ("online".equals(itemSubtype)) return ONLINE;
        if ("extra".equals(itemSubtype)) return EXTRA;
        return ONSITE;
    }
}
