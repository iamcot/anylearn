package com.anylearn.backend.repository;

import com.anylearn.backend.entity.VoucherEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherEventLogRepository extends JpaRepository<VoucherEventLog, Long> {
}
