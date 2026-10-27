package com.anylearn.backend.service.chat;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChatRulesTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 27, 10, 0);

    @Test
    void displayNameIsTrimmedAndKeepsNoContactDetails() {
        assertThat(ChatRules.cleanDisplayName("  Mẹ   Bin ")).isEqualTo("Mẹ Bin");
        assertThatThrownBy(() -> ChatRules.cleanDisplayName("Mẹ Bin 0912345678")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ChatRules.cleanDisplayName("me@bin.vn")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ChatRules.cleanDisplayName("A")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void emptyOrTooLongMessageIsRefused() {
        assertThatThrownBy(() -> ChatRules.cleanBody("   ")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ChatRules.cleanBody("a".repeat(1001))).isInstanceOf(IllegalArgumentException.class);
        assertThat(ChatRules.cleanBody(" xin chào ")).isEqualTo("xin chào");
    }

    @Test
    void bannedWordsIgnoreAccentsAndCase() {
        List<String> words = ChatRules.parseWords("Quảng cáo, chính trị\n");
        assertThat(words).containsExactly("quang cao", "chinh tri");
        assertThat(ChatRules.findBannedWord("Đừng QUANG CAO ở đây", words)).isEqualTo("quang cao");
        assertThat(ChatRules.findBannedWord("Mai đổi phòng học", words)).isNull();
        assertThat(ChatRules.findBannedWord("bất kỳ", List.of())).isNull();
    }

    @Test
    void rateLimitCountsTheLastMinute() {
        assertThat(ChatRules.rateLimited(19, 20)).isFalse();
        assertThat(ChatRules.rateLimited(20, 20)).isTrue();
        assertThat(ChatRules.rateLimited(500, 0)).isFalse();
    }

    @Test
    void whoMaySpeak() {
        assertThat(ChatRules.sendProblem(false, false, null, true, false, false, NOW)).isNull();
        assertThat(ChatRules.sendProblem(false, true, null, true, false, false, NOW)).contains("khóa chat");
        assertThat(ChatRules.sendProblem(true, false, null, true, false, false, NOW)).contains("khóa");
        assertThat(ChatRules.sendProblem(true, false, null, true, false, true, NOW)).isNull();
        assertThat(ChatRules.sendProblem(false, false, null, false, false, false, NOW)).contains("nội quy");
        assertThat(ChatRules.sendProblem(false, false, NOW.plusHours(1), true, false, false, NOW)).contains("tạm khóa");
        assertThat(ChatRules.sendProblem(false, false, NOW.minusHours(1), true, false, false, NOW)).isNull();
        assertThat(ChatRules.sendProblem(false, false, null, true, true, false, NOW)).contains("rời");
    }

    @Test
    void courseStaysReadableForTheRetentionPeriodAfterItEnds() {
        LocalDate today = LocalDate.of(2026, 10, 27);
        assertThat(ChatRules.stillInGroup("active", null, today, 30)).isTrue();
        assertThat(ChatRules.stillInGroup("active", today.minusDays(29), today, 30)).isTrue();
        assertThat(ChatRules.stillInGroup("active", today.minusDays(31), today, 30)).isFalse();
        assertThat(ChatRules.stillInGroup("pending", null, today, 30)).isFalse();
    }

    @Test
    void classLabelJoinsClassesAndIsCapped() {
        assertThat(ChatRules.classLabel(List.of("Thứ 2 18:00", "Thứ 4 18:00"))).isEqualTo("Thứ 2 18:00, Thứ 4 18:00");
        assertThat(ChatRules.classLabel(List.of("a".repeat(200)))).hasSize(100).endsWith("…");
    }
}
