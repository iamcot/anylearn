package com.anylearn.backend.service.insights;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SearchLogPolicyTest {

    private static final SearchContext CONTEXT = new SearchContext("ref-12345678", "session-1", "child", 9, null);

    private static SearchQuery query(String keyword, String age, Long authorId) {
        return new SearchQuery(keyword, "class", null, age, null, null, null, authorId);
    }

    @Test
    void logsASearchWithAKeywordOrAFilterOnTheFirstPage() {
        assertThat(SearchLogPolicy.shouldLog(query("bóng đá", null, null), 0, CONTEXT)).isTrue();
        assertThat(SearchLogPolicy.shouldLog(query(null, "6-10", null), 0, CONTEXT)).isTrue();
    }

    @Test
    void skipsPagingTheEmptyBrowsePageAndAuthorLinks() {
        assertThat(SearchLogPolicy.shouldLog(query("bóng đá", null, null), 1, CONTEXT)).isFalse();
        assertThat(SearchLogPolicy.shouldLog(query("  ", null, null), 0, CONTEXT)).isFalse();
        assertThat(SearchLogPolicy.shouldLog(query(null, null, 42L), 0, CONTEXT)).isFalse();
    }

    @Test
    void needsAUsableRef() {
        assertThat(SearchLogPolicy.shouldLog(query("bóng đá", null, null), 0, null)).isFalse();
        assertThat(SearchLogPolicy.shouldLog(query("bóng đá", null, null), 0,
                new SearchContext(null, "s", null, null, null))).isFalse();
        assertThat(SearchLogPolicy.isValidRef("short")).isFalse();
        assertThat(SearchLogPolicy.isValidRef("has space in it 123")).isFalse();
        assertThat(SearchLogPolicy.isValidRef("a".repeat(41))).isFalse();
        assertThat(SearchLogPolicy.isValidRef("3f2c9d1e-aa11-4b5e")).isTrue();
    }

    @Test
    void cleansValuesBeforeTheyAreStored() {
        assertThat(SearchLogPolicy.clean("  hi  ", 10)).isEqualTo("hi");
        assertThat(SearchLogPolicy.clean("   ", 10)).isNull();
        assertThat(SearchLogPolicy.clean("abcdefghij", 4)).isEqualTo("abcd");
        assertThat(SearchLogPolicy.cleanMode("school")).isEqualTo("school");
        assertThat(SearchLogPolicy.cleanMode("whatever")).isEqualTo("class");
        assertThat(SearchLogPolicy.cleanAudience("child")).isEqualTo("child");
        assertThat(SearchLogPolicy.cleanAudience("robot")).isNull();
        assertThat(SearchLogPolicy.cleanLearnerAge(9)).isEqualTo(9);
        assertThat(SearchLogPolicy.cleanLearnerAge(-1)).isNull();
        assertThat(SearchLogPolicy.cleanLearnerAge(400)).isNull();
    }
}
