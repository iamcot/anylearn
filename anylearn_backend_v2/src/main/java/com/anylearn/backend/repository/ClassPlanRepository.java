package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ClassPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassPlanRepository extends JpaRepository<ClassPlan, Long> {
}
