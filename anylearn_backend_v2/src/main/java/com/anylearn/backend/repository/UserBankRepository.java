package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBankRepository extends JpaRepository<UserBank, Long> {
}
