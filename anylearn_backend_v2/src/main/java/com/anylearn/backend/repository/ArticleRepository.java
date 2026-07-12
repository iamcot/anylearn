package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Article;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByStatusAndTypeOrderByIdDesc(Byte status, String type, Pageable pageable);
    List<Article> findByStatusAndTypeInOrderByIdDesc(Byte status, List<String> types, Pageable pageable);
}
