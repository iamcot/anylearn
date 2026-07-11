package com.anylearn.backend.repository;

import com.anylearn.backend.entity.VoucherEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherEventRepository extends JpaRepository<VoucherEvent, Long> {
}
