package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemActivityRepository extends JpaRepository<ItemActivity, Long> {
}
