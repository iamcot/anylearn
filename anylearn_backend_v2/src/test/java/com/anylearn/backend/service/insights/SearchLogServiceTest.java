package com.anylearn.backend.service.insights;

import com.anylearn.backend.entity.SearchLog;
import com.anylearn.backend.repository.SearchLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SearchLogServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 25, 10, 0);
    private static final SearchContext CONTEXT = new SearchContext("ref-12345678", "session-1", "child", 9, 7L);

    private SearchLogRepository logs;
    private SearchLogService service;

    @BeforeEach
    void setUp() {
        logs = mock(SearchLogRepository.class);
        service = new SearchLogService(logs);
    }

    private static SearchQuery bongDa() {
        return new SearchQuery("  Bóng Đá  Quận 7 ", "class", "the-thao", "6-10", null, "79", "offline", null);
    }

    @Test
    void buildsTheRowFromTheRequest() {
        SearchLog entry = SearchLogService.toEntry(bongDa(), CONTEXT, 12, NOW);

        assertThat(entry.getKeyword()).isEqualTo("Bóng Đá  Quận 7");
        assertThat(entry.getKeywordNormalized()).isEqualTo("bong da quan 7");
        assertThat(entry.getRef()).isEqualTo("ref-12345678");
        assertThat(entry.getUserId()).isEqualTo(7L);
        assertThat(entry.getSessionKey()).isEqualTo("session-1");
        assertThat(entry.getAgeFilter()).isEqualTo("6-10");
        assertThat(entry.getLocationFilter()).isEqualTo("79");
        assertThat(entry.getFormatFilter()).isEqualTo("offline");
        assertThat(entry.getAudience()).isEqualTo("child");
        assertThat(entry.getLearnerAge()).isEqualTo(9);
        assertThat(entry.getResultCount()).isEqualTo(12);
        assertThat(entry.getCreatedAt()).isEqualTo(NOW);
    }

    @Test
    void aSearchWithoutAKeywordHasNoNormalizedKeyword() {
        SearchLog entry = SearchLogService.toEntry(new SearchQuery(null, null, null, "3-5", null, null, null, null), CONTEXT, 0, NOW);

        assertThat(entry.getKeyword()).isNull();
        assertThat(entry.getKeywordNormalized()).isNull();
        assertThat(entry.getMode()).isEqualTo("class");
    }

    @Test
    void savesASearchWorthLogging() {
        service.record(bongDa(), 0, CONTEXT, 0);

        ArgumentCaptor<SearchLog> saved = ArgumentCaptor.forClass(SearchLog.class);
        verify(logs).save(saved.capture());
        assertThat(saved.getValue().getResultCount()).isZero();
    }

    @Test
    void refinesTheEarlierSearchOfTheSameWordsInsteadOfAddingOne() {
        SearchLog earlier = SearchLogService.toEntry(
                new SearchQuery("bóng đá quận 7", "class", null, null, null, null, null, null),
                new SearchContext("first-ref-1234", "session-1", null, null, null), 5, NOW);
        earlier.setId(1L);
        earlier.setClickedItemId(8L);
        when(logs.findFirstBySessionKeyAndKeywordNormalizedAndModeAndCreatedAtAfterOrderByIdDesc(
                eq("session-1"), eq("bong da quan 7"), eq("class"), any())).thenReturn(Optional.of(earlier));

        service.record(new SearchQuery("bóng đá quận 7", "class", "the-thao", "6-10", null, "79", null, null), 0, CONTEXT, 0);

        ArgumentCaptor<SearchLog> saved = ArgumentCaptor.forClass(SearchLog.class);
        verify(logs).save(saved.capture());
        assertThat(saved.getValue()).isSameAs(earlier);
        assertThat(earlier.getRef()).isEqualTo("ref-12345678");
        assertThat(earlier.getAgeFilter()).isEqualTo("6-10");
        assertThat(earlier.getLocationFilter()).isEqualTo("79");
        assertThat(earlier.getResultCount()).isZero();
        assertThat(earlier.getCreatedAt()).isEqualTo(NOW);
        assertThat(earlier.getClickedItemId()).isEqualTo(8L);
    }

    @Test
    void searchesWithoutABrowserIdAreNeverMerged() {
        SearchContext anonymous = new SearchContext("ref-12345678", null, null, null, null);

        service.record(bongDa(), 0, anonymous, 3);

        verify(logs, never()).findFirstBySessionKeyAndKeywordNormalizedAndModeAndCreatedAtAfterOrderByIdDesc(any(), any(), any(), any());
        verify(logs).save(any(SearchLog.class));
    }

    @Test
    void skipsARefThatIsAlreadyStored() {
        when(logs.existsByRef("ref-12345678")).thenReturn(true);

        service.record(bongDa(), 0, CONTEXT, 3);

        verify(logs, never()).save(any());
    }

    @Test
    void skipsSearchesThePolicyRejects() {
        service.record(bongDa(), 2, CONTEXT, 3);

        verify(logs, never()).save(any());
    }

    @Test
    void aFailingDatabaseNeverReachesTheSearch() {
        when(logs.save(any())).thenThrow(new RuntimeException("db down"));

        service.record(bongDa(), 0, CONTEXT, 3);
    }

    @Test
    void recordsAClickOnlyWithAValidRefAndItem() {
        service.recordClick("ref-12345678", 5L);
        verify(logs).markFirstClick(org.mockito.ArgumentMatchers.eq("ref-12345678"), org.mockito.ArgumentMatchers.eq(5L), any());

        service.recordClick("bad", 5L);
        service.recordClick("ref-12345678", null);
        verify(logs, org.mockito.Mockito.times(1)).markFirstClick(any(), any(), any());
    }
}
