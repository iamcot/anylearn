package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query(value = "SELECT GROUP_CONCAT(t.tag SEPARATOR ' ') FROM tags t WHERE t.item_id = :itemId AND t.status = 1", nativeQuery = true)
    String findTagsByItemId(@Param("itemId") Long itemId);

    @Query("SELECT DISTINCT t.tag FROM Tag t WHERE t.status = 1 AND t.type = 'class' AND (:q IS NULL OR t.tag LIKE %:q%)")
    List<String> findDistinctActiveTags(@Param("q") String q);
}
