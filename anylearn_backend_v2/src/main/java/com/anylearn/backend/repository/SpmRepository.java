package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Spm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpmRepository extends JpaRepository<Spm, Long> {
}
