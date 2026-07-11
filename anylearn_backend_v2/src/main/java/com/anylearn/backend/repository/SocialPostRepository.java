package com.anylearn.backend.repository;

import com.anylearn.backend.entity.SocialPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SocialPostRepository extends JpaRepository<SocialPost, Long> {
}
