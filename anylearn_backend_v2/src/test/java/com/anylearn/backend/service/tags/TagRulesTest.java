package com.anylearn.backend.service.tags;

import com.anylearn.backend.entity.Tag;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TagRulesTest {

    private static Tag tag(long id, String name) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(name);
        return tag;
    }

    @Test
    void cleanNameTrimsAndCollapsesSpaces() {
        assertThat(TagRules.cleanName("  Bóng   rổ ")).isEqualTo("Bóng rổ");
    }

    @Test
    void cleanNameRejectsEmptyAndTooLong() {
        assertThat(TagRules.cleanName("   ")).isNull();
        assertThat(TagRules.cleanName(null)).isNull();
        assertThat(TagRules.cleanName("a".repeat(TagRules.MAX_NAME_LENGTH + 1))).isNull();
    }

    @Test
    void accentsAndCaseDoNotMakeANewTag() {
        List<Tag> existing = List.of(tag(1, "Bóng rổ"), tag(2, "Cờ vua"));
        assertThat(TagRules.findSameName(existing, "bong  RO", null)).map(Tag::getId).contains(1L);
        assertThat(TagRules.findSameName(existing, "Bơi lội", null)).isEmpty();
    }

    @Test
    void renamingATagIgnoresItself() {
        List<Tag> existing = List.of(tag(1, "Bóng rổ"));
        assertThat(TagRules.findSameName(existing, "Bóng Rổ", 1L)).isEmpty();
    }
}
