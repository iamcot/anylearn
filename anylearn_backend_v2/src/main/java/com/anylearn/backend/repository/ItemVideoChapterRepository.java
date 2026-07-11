package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemVideoChapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemVideoChapterRepository extends JpaRepository<ItemVideoChapter, Long> {
}
