package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface UserEventRepository extends JpaRepository<UserEvent, Long> {

    boolean existsByUserIdAndVisitorIdAndTypeAndCreatedAtAfter(
            Long userId, Long visitorId, String type, LocalDateTime after);
}
