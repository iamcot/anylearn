package com.anylearn.backend.service.insights;

import com.anylearn.backend.entity.SearchLog;
import com.anylearn.backend.repository.SearchLogRepository;
import com.anylearn.backend.service.PersonNames;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class SearchLogService {

    // Searching the same words again inside this window refines the same search instead of adding one.
    static final int REFINE_WINDOW_SECONDS = 10;

    private final SearchLogRepository logs;

    /** Runs after the search answered, off the request thread: a logging problem must never break a search. */
    @Async("searchLogExecutor")
    public void record(SearchQuery query, int page, SearchContext context, int resultCount) {
        try {
            if (!SearchLogPolicy.shouldLog(query, page, context)) return;
            SearchLog entry = toEntry(query, context, resultCount, LocalDateTime.now());
            if (logs.existsByRef(entry.getRef())) return;
            logs.save(findEarlierSearch(entry).map(earlier -> refine(earlier, entry)).orElse(entry));
        } catch (Exception e) {
            log.warn("[search-log] not recorded: {}", e.getMessage());
        }
    }

    public void recordClick(String ref, Long itemId) {
        if (!SearchLogPolicy.isValidRef(ref) || itemId == null) return;
        logs.markFirstClick(ref, itemId, LocalDateTime.now());
    }

    static SearchLog toEntry(SearchQuery query, SearchContext context, int resultCount, LocalDateTime now) {
        SearchLog entry = new SearchLog();
        entry.setRef(context.ref());
        entry.setUserId(context.userId());
        entry.setSessionKey(SearchLogPolicy.clean(context.sessionKey(), SearchLogPolicy.MAX_SESSION_KEY_LENGTH));
        String keyword = SearchLogPolicy.cleanKeyword(query.keyword());
        entry.setKeyword(keyword);
        String normalized = keyword == null ? "" : PersonNames.normalize(keyword);
        entry.setKeywordNormalized(normalized.isEmpty() ? null : normalized);
        entry.setMode(SearchLogPolicy.cleanMode(query.mode()));
        entry.setCategory(SearchLogPolicy.clean(query.category(), SearchLogPolicy.MAX_CATEGORY_LENGTH));
        entry.setAgeFilter(SearchLogPolicy.cleanFilter(query.age()));
        entry.setPriceFilter(SearchLogPolicy.cleanFilter(query.price()));
        entry.setLocationFilter(SearchLogPolicy.cleanFilter(query.location()));
        entry.setFormatFilter(SearchLogPolicy.cleanFilter(query.format()));
        entry.setAudience(SearchLogPolicy.cleanAudience(context.audience()));
        entry.setLearnerAge(SearchLogPolicy.cleanLearnerAge(context.learnerAge()));
        entry.setResultCount(Math.max(0, resultCount));
        entry.setCreatedAt(now);
        return entry;
    }

    private Optional<SearchLog> findEarlierSearch(SearchLog entry) {
        if (entry.getSessionKey() == null) return Optional.empty();
        return logs.findFirstBySessionKeyAndKeywordNormalizedAndModeAndCreatedAtAfterOrderByIdDesc(
                entry.getSessionKey(), entry.getKeywordNormalized(), entry.getMode(),
                entry.getCreatedAt().minusSeconds(REFINE_WINDOW_SECONDS));
    }

    // The latest state wins (its ref is the one the next click names); the time and any click of the first search stay.
    static SearchLog refine(SearchLog earlier, SearchLog latest) {
        earlier.setRef(latest.getRef());
        earlier.setCategory(latest.getCategory());
        earlier.setAgeFilter(latest.getAgeFilter());
        earlier.setPriceFilter(latest.getPriceFilter());
        earlier.setLocationFilter(latest.getLocationFilter());
        earlier.setFormatFilter(latest.getFormatFilter());
        earlier.setAudience(latest.getAudience());
        earlier.setLearnerAge(latest.getLearnerAge());
        earlier.setResultCount(latest.getResultCount());
        return earlier;
    }
}
