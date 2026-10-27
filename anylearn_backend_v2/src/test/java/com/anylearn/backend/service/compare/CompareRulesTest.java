package com.anylearn.backend.service.compare;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import com.anylearn.backend.service.compare.CompareRules.Topic;

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
        assertThat(CompareRules.scheduleLine(null, null, null, true)).isEqualTo("Linh hoạt, chọn ngày bắt đầu");
        assertThat(CompareRules.scheduleLine("sat", "09:00", "10:30", true)).isEqualTo("T7 · 09:00-10:30 (linh hoạt)");
    }

    private static Topic topic(String title, String category, String... tags) {
        java.util.Set<String> keys = new java.util.LinkedHashSet<>();
        if (category != null) keys.add(category.toLowerCase());
        for (String t : tags) keys.add(t.toLowerCase());
        return new Topic(title, category == null ? List.of() : List.of(category), keys);
    }

    @Test
    void oneCourseOfAnotherFieldIsFlagged() {
        var notice = CompareRules.fieldNotice(List.of(topic("Bơi A", "Thể thao"), topic("Bơi B", "Thể thao"), topic("Code C", "Lập trình")));
        assertThat(notice.off()).containsExactly(2);
        assertThat(notice.text()).contains("Code C").contains("Lập trình").contains("khác so với các khóa còn lại");
    }

    @Test
    void sharedTagCountsAsRelated() {
        assertThat(CompareRules.fieldNotice(List.of(topic("A", "Thể thao", "bóng đá"), topic("B", "Kỹ năng", "bóng đá")))).isNull();
    }

    @Test
    void allDifferentIsSaidOnceAndUnknownIsNotDifferent() {
        assertThat(CompareRules.fieldNotice(List.of(topic("A", "Thể thao"), topic("B", "Lập trình"))).text()).contains("lĩnh vực khác nhau");
        assertThat(CompareRules.fieldNotice(List.of(topic("A", "Thể thao"), topic("B", null)))).isNull();
        assertThat(CompareRules.fieldNotice(List.of(topic("A", "Thể thao")))).isNull();
    }
}
