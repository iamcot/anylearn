package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NewUserDefaultsTest {

    // Filled by the caller: identity and credentials differ per flow (register, add child).
    private static final Set<String> SET_BY_CALLER = Set.of("phone", "refcode", "password", "role", "name");

    @Test
    void fillsEveryRequiredColumnNotSetByTheCaller() throws IllegalAccessException {
        User user = new User();

        NewUserDefaults.apply(user);

        List<String> missing = new ArrayList<>();
        for (Field field : User.class.getDeclaredFields()) {
            Column column = field.getAnnotation(Column.class);
            if (column == null || column.nullable() || SET_BY_CALLER.contains(field.getName())) continue;
            field.setAccessible(true);
            if (field.get(user) == null) missing.add(field.getName());
        }
        assertThat(missing).as("NOT NULL columns left null").isEmpty();
    }
}
