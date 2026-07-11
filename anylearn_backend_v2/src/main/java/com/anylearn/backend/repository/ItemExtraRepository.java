package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemExtraRepository extends JpaRepository<ItemExtra, Long> {
}
