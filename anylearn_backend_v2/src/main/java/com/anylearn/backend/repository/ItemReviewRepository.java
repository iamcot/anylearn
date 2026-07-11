package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemReviewRepository extends JpaRepository<ItemReview, Long> {
}
