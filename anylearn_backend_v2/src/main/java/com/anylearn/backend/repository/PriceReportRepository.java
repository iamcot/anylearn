package com.anylearn.backend.repository;

import com.anylearn.backend.entity.PriceReport;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceReportRepository extends JpaRepository<PriceReport, Long> {

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    long countByContactPhoneAndCreatedAtAfter(String contactPhone, LocalDateTime after);

    // Reports nobody has looked at yet come first, then the newest.
    @Query("""
            SELECT r FROM PriceReport r WHERE (:status IS NULL OR r.status = :status)
            ORDER BY CASE WHEN r.status = 'new' THEN 0 ELSE 1 END, r.createdAt DESC
            """)
    List<PriceReport> findForAdmin(@Param("status") String status, Pageable pageable);
}
