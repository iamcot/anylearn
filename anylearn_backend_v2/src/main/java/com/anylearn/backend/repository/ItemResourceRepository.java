package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemResourceRepository extends JpaRepository<ItemResource, Long> {
}
