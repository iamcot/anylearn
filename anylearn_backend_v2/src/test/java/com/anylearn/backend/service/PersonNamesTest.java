package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PersonNamesTest {

    private static User child(long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    @Test
    void ignoresAccentsCaseAndSpacing() {
        assertThat(PersonNames.normalize("  Đức   Anh ")).isEqualTo("duc anh");
        assertThat(PersonNames.normalize("Bé BIN")).isEqualTo("be bin");
        assertThat(PersonNames.normalize(null)).isEmpty();
    }

    @Test
    void sameNameNeedsARealName() {
        assertThat(PersonNames.sameName("Bin", " bin ")).isTrue();
        assertThat(PersonNames.sameName("Bin", "Su")).isFalse();
        assertThat(PersonNames.sameName("", "")).isFalse();
    }

    @Test
    void refusesASecondChildWithTheSameName() {
        List<User> children = List.of(child(1, "Bin"), child(2, "Su"));

        assertThatThrownBy(() -> PersonNames.requireUniqueChildName(children, "bin", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Đã có bé tên");
        assertThatCode(() -> PersonNames.requireUniqueChildName(children, "Gà", null)).doesNotThrowAnyException();
    }

    @Test
    void aChildDoesNotClashWithItself() {
        List<User> children = List.of(child(1, "Bin"), child(2, "Su"));

        assertThatCode(() -> PersonNames.requireUniqueChildName(children, "BIN", 1L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> PersonNames.requireUniqueChildName(children, "Su", 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
