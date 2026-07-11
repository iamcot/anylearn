package com.anylearn.backend.repository;

import com.anylearn.backend.entity.VoucherUsed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherUsedRepository extends JpaRepository<VoucherUsed, Long> {
}
