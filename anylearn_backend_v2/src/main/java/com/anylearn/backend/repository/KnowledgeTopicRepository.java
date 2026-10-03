package com.anylearn.backend.repository;

import com.anylearn.backend.entity.KnowledgeTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeTopicRepository extends JpaRepository<KnowledgeTopic, Long> {
    List<KnowledgeTopic> findByTypeAndStatusGreaterThanOrderByIdAsc(String type, Byte status);
}
