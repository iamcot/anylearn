package com.anylearn.backend.service.landing;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LandingRulesTest {

    @Test
    void pathIsBuiltFromSlugsAndParsedBack() {
        String path = LandingRules.path("Bơi lội", 5, "Quận 7");
        assertThat(path).isEqualTo("boi-loi/5-tuoi/quan-7");
        LandingRules.Parts parts = LandingRules.parse("/" + path + "/");
        assertThat(parts).isEqualTo(new LandingRules.Parts("boi-loi", 5, "quan-7"));
        assertThat(LandingRules.path("Đàn piano", 8, "Thành phố Thủ Đức")).isEqualTo("dan-piano/8-tuoi/thanh-pho-thu-duc");
    }

    @Test
    void parseRejectsWrongShapesAndAges() {
        assertThat(LandingRules.parse(null)).isNull();
        assertThat(LandingRules.parse("boi/5/quan-7")).isNull();
        assertThat(LandingRules.parse("boi/2-tuoi/quan-7")).isNull();
        assertThat(LandingRules.parse("boi/16-tuoi/quan-7")).isNull();
        assertThat(LandingRules.parse("boi/5-tuoi/quan 7")).isNull();
        assertThat(LandingRules.parse("BOI/5-tuoi/quan-7")).isEqualTo(new LandingRules.Parts("boi", 5, "quan-7"));
    }

    @Test
    void enoughCoursesNeedsThree() {
        assertThat(LandingRules.enoughCourses(2)).isFalse();
        assertThat(LandingRules.enoughCourses(3)).isTrue();
    }

    @Test
    void titleAndTexts() {
        assertThat(LandingRules.title("bơi", 5, "Quận 7")).isEqualTo("Bơi cho trẻ 5 tuổi tại Quận 7, TP.HCM");
        assertThat(LandingRules.metaDescription("Bơi", 5, "Quận 7", 4)).startsWith("4 khóa bơi phù hợp trẻ 5 tuổi ở Quận 7");
        assertThat(LandingRules.defaultIntro("Bơi", 5, "Quận 7", 4)).contains("4 khóa bơi").contains("Quận 7, TP.HCM");
    }

    @Test
    void introAndStatusAreChecked() {
        assertThat(LandingRules.cleanIntro("  ")).isNull();
        assertThat(LandingRules.cleanIntro(" Chào ")).isEqualTo("Chào");
        assertThatThrownBy(() -> LandingRules.cleanIntro("a".repeat(LandingRules.MAX_INTRO + 1))).isInstanceOf(IllegalArgumentException.class);
        assertThat(LandingRules.cleanIntroStatus("APPROVED")).isEqualTo("approved");
        assertThat(LandingRules.cleanIntroStatus(null)).isEqualTo("none");
        assertThatThrownBy(() -> LandingRules.cleanIntroStatus("live")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void faqUsesOnlyKnownFigures() {
        List<Map<String, String>> few = LandingRules.faq("Bơi", 5, "Quận 7", 3, null, null, 0);
        assertThat(few).hasSize(2);
        assertThat(few.get(0).get("answer")).contains("3 khóa bơi");
        assertThat(few.get(1).get("answer")).contains("hoàn tiền");

        List<Map<String, String>> full = LandingRules.faq("Bơi", 5, "Quận 7", 5, 1_200_000L, 2_500_000L, 2);
        assertThat(full).hasSize(4);
        assertThat(full.get(1).get("answer")).contains("từ 1.200.000đ đến 2.500.000đ");
        assertThat(full.get(2).get("answer")).contains("Có 2 khóa");

        assertThat(LandingRules.faq("Bơi", 5, "Quận 7", 5, 900_000L, 900_000L, 0).get(1).get("answer")).contains("900.000đ mỗi khóa");
    }
}
