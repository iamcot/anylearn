package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Activitybonus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivitybonusRepository extends JpaRepository<Activitybonus, String> {
}
