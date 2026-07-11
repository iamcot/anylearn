package com.anylearn.backend.repository;

import com.anylearn.backend.entity.VoucherGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherGroupRepository extends JpaRepository<VoucherGroup, Long> {
}
