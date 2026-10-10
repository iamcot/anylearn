package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ItemEventRepository extends JpaRepository<ItemEvent, Long> {

    @Query(value = "SELECT COUNT(*) FROM item_events WHERE item_id = :id AND type = :type",
           nativeQuery = true)
    int countByItemAndType(@Param("id") Long id, @Param("type") String type);

    boolean existsByItemIdAndUserIdAndTypeAndCreatedAtAfter(
            Long itemId, Long userId, String type, LocalDateTime after);
}
