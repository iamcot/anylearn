package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemSpecLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemSpecLinkRepository extends JpaRepository<ItemSpecLink, Long> {
}
