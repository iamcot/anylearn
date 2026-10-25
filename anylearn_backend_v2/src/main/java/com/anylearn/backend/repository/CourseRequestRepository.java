package com.anylearn.backend.repository;

import com.anylearn.backend.entity.CourseRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CourseRequestRepository extends JpaRepository<CourseRequest, Long> {

    long countByContactPhoneAndCreatedAtAfter(String contactPhone, LocalDateTime after);

    // Requests nobody has looked at yet come first, then the newest.
    @Query("""
            SELECT c FROM CourseRequest c WHERE (:status IS NULL OR c.status = :status)
            ORDER BY CASE WHEN c.status = 'new' THEN 0 ELSE 1 END, c.createdAt DESC
            """)
    List<CourseRequest> findForAdmin(@Param("status") String status, Pageable pageable);
}
