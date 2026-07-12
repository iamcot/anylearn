package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Article;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByStatusAndTypeOrderByIdDesc(Byte status, String type, Pageable pageable);
    List<Article> findByStatusAndTypeInOrderByIdDesc(Byte status, List<String> types, Pageable pageable);

    @Query("SELECT new map(a.id as id, a.title as title, a.image as image, a.type as type, a.shortContent as short_content, a.view as view, a.like as like, a.createdAt as createdAt) FROM Article a WHERE a.status = :status AND a.type IN :types ORDER BY a.id DESC")
    List<java.util.Map<String, Object>> findLightByStatusAndTypeIn(Byte status, List<String> types, Pageable pageable);

    @Query("SELECT new map(a.id as id, a.title as title, a.image as image, a.type as type, a.shortContent as short_content, a.view as view, a.like as like, a.createdAt as createdAt) FROM Article a WHERE a.status = :status AND a.type = :type ORDER BY a.id DESC")
    List<java.util.Map<String, Object>> findLightByStatusAndType(Byte status, String type, Pageable pageable);
}
