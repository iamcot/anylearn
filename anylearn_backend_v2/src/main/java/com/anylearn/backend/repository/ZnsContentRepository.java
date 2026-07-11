package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ZnsContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZnsContentRepository extends JpaRepository<ZnsContent, Long> {
}
