package com.anylearn.backend.repository;

import com.anylearn.backend.entity.I18nContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface I18nContentRepository extends JpaRepository<I18nContent, Long> {
}
