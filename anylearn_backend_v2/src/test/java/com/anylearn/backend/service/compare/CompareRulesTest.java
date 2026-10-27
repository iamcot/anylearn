package com.anylearn.backend.service.compare;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CompareRulesTest {

    @Test
    void idsKeepOrderDropRepeatsAndJunkAndStopAtThree() {
        assertThat(CompareRules.parseIds("5, 3,x,5,9,2")).containsExactly(5L, 3L, 9L);
        assertThat(CompareRules.parseIds(null)).isEmpty();
        assertThat(CompareRules.parseIds("-1,0")).isEmpty();
    }

    @Test
    void plainTextStripsHtmlAndCuts() {
        assertThat(CompareRules.plainText("<p>Học <b>vẽ</b>&nbsp;cùng bạn</p><script>x()</script><ul><li>A</li><li>B</li></ul>"))
                .isEqualTo("Học vẽ cùng bạn\nA\nB");
        assertThat(CompareRules.plainText("a".repeat(5000))).hasSize(3000);
    }

    @Test
    void hashChangesOnlyWithTheText() {
        String a = CompareRules.contentHash("T", "<p>x</p>", "y");
        assertThat(CompareRules.contentHash("T", "x", "y")).isEqualTo(a);
        assertThat(CompareRules.contentHash("T", "x", "z")).isNotEqualTo(a);
    }

    @Test
    void factsKeepKnownKeysAndAllowedIdsOnly() {
        String json = "{\"courses\":[{\"id\":1,\"audience\":\"Bé 6-8 tuổi\",\"method\":\"Không nêu\",\"outcome\":\"\",\"bogus\":\"x\"},{\"id\":9,\"audience\":\"lạ\"}]}";
        var facts = CompareRules.parseFacts(json, Set.of(1L, 2L));
        assertThat(facts).containsOnlyKeys(1L);
        assertThat(facts.get(1L)).containsOnlyKeys("audience").containsEntry("audience", "Bé 6-8 tuổi");
        assertThat(CompareRules.parseFacts("not json", Set.of(1L))).isEmpty();
    }

    @Test
    void bestOnlyWhenClear() {
        assertThat(CompareRules.bestIndex(List.of(300, 200, 250), true)).isEqualTo(1);
        assertThat(CompareRules.bestIndex(List.of(100, 100, 250), true)).isNull();
        assertThat(CompareRules.bestIndex(Arrays.asList(100, null), true)).isNull();
        assertThat(CompareRules.bestIndex(Arrays.asList(null, 5, 9), false)).isEqualTo(2);
    }

    @Test
    void mixedFormatsAndScheduleLine() {
        assertThat(CompareRules.mixedFormats(List.of("online", "offline"))).isTrue();
        assertThat(CompareRules.mixedFormats(List.of("online", "video"))).isFalse();
        assertThat(CompareRules.scheduleLine("mon,wed", "18:00", "19:30")).isEqualTo("T2, T4 · 18:00-19:30");
        assertThat(CompareRules.scheduleLine(null, "9:00", null)).isEqualTo("9:00");
        assertThat(CompareRules.scheduleLine(null, null, null)).isEmpty();
    }
}
