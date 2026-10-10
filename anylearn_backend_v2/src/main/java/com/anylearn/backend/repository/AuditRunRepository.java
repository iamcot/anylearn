package com.anylearn.backend.repository;

import com.anylearn.backend.entity.AuditRun;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditRunRepository extends JpaRepository<AuditRun, Long> {
    List<AuditRun> findAllByOrderByRanAtDesc(Pageable pageable);
}
