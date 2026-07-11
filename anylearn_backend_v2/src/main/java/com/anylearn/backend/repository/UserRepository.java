package com.anylearn.backend.repository;

import com.anylearn.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByApiToken(String apiToken);
    Optional<User> findByPhone(String phone);
}
