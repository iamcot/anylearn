package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemCodeNotifTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemCodeNotifTemplateRepository extends JpaRepository<ItemCodeNotifTemplate, Long> {
}
