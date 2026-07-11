package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemCodeRepository extends JpaRepository<ItemCode, Long> {
}
