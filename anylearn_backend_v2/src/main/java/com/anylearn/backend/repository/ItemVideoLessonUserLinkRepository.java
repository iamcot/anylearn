package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemVideoLessonUserLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemVideoLessonUserLinkRepository extends JpaRepository<ItemVideoLessonUserLink, Long> {
}
