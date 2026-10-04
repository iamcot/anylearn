package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndReadIsNullAndTypeNotIn(Long userId, List<String> excludedTypes);

    @Modifying
    @Query("UPDATE Notification n SET n.read = :now WHERE n.userId = :userId AND n.read IS NULL AND n.type NOT IN :excludedTypes")
    int markAllReadByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now, @Param("excludedTypes") List<String> excludedTypes);
}
