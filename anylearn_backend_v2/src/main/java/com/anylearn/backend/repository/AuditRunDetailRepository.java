package com.anylearn.backend.repository;

import com.anylearn.backend.entity.AuditRunDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditRunDetailRepository extends JpaRepository<AuditRunDetail, Long> {
    List<AuditRunDetail> findByRunId(Long runId);
}
