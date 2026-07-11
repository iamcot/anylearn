package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Ask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AskRepository extends JpaRepository<Ask, Long> {
}
