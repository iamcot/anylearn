package com.anylearn.backend.repository;

import com.anylearn.backend.entity.KnowledgeCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KnowledgeCategoryRepository extends JpaRepository<KnowledgeCategory, Long> {
}
