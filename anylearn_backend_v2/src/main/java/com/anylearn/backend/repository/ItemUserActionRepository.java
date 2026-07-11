package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemUserAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemUserActionRepository extends JpaRepository<ItemUserAction, Long> {
}
