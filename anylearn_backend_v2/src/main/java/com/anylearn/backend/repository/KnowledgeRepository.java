package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Knowledge;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeRepository extends JpaRepository<Knowledge, Long> {

    @Query("SELECT k FROM Knowledge k WHERE k.type = :type AND k.status > 0 " +
           "ORDER BY k.isTopQuestion DESC, k.view DESC")
    List<Knowledge> findTopByType(@Param("type") String type, Pageable pageable);

    @Query("SELECT k FROM Knowledge k WHERE k.knowledgeCategoryId IN :categoryIds AND k.status > 0 " +
           "ORDER BY k.isTopQuestion DESC, k.view DESC")
    List<Knowledge> findByCategoryIds(@Param("categoryIds") List<Long> categoryIds);
}
