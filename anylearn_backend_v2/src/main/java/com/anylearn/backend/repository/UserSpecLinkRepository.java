package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserSpecLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSpecLinkRepository extends JpaRepository<UserSpecLink, Long> {
}
