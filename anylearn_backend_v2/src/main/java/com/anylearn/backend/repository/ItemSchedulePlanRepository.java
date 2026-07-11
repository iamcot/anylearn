package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemSchedulePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemSchedulePlanRepository extends JpaRepository<ItemSchedulePlan, Long> {
}
