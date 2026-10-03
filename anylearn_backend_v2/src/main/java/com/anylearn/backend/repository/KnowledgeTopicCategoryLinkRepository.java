package com.anylearn.backend.repository;

import com.anylearn.backend.entity.KnowledgeTopicCategoryLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeTopicCategoryLinkRepository extends JpaRepository<KnowledgeTopicCategoryLink, Long> {
    List<KnowledgeTopicCategoryLink> findByKnowledgeTopicId(Long knowledgeTopicId);
}
