package com.anylearn.backend.repository;

import com.anylearn.backend.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {

    boolean existsByRef(String ref);

    // The same browser searching the same words again within seconds is one search being refined (a filter added,
    // a page that fetches twice), not a new wish: the caller updates this row.
    Optional<SearchLog> findFirstBySessionKeyAndKeywordNormalizedAndModeAndCreatedAtAfterOrderByIdDesc(
            String sessionKey, String keywordNormalized, String mode, LocalDateTime after);

    // Only the first click of a search is kept: it is the result the visitor chose.
    @Modifying
    @Transactional
    @Query("UPDATE SearchLog s SET s.clickedItemId = :itemId, s.clickedAt = :now WHERE s.ref = :ref AND s.clickedItemId IS NULL")
    int markFirstClick(@Param("ref") String ref, @Param("itemId") Long itemId, @Param("now") LocalDateTime now);
}
