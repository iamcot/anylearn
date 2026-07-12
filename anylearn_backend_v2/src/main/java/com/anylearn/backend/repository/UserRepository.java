package com.anylearn.backend.repository;

import com.anylearn.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByApiToken(String apiToken);
    Optional<User> findByPhone(String phone);

    @Query("""
        SELECT u FROM User u
        WHERE u.role = :role
          AND u.updateDoc = 1
          AND u.status = 1
          AND u.isTest = 0
        ORDER BY u.isHot DESC, u.boostScore DESC, u.firstName ASC
        """)
    Page<User> findActiveByRole(@Param("role") String role, Pageable pageable);

    List<User> findByUserIdAndIsChild(Long userId, Byte isChild);
}
