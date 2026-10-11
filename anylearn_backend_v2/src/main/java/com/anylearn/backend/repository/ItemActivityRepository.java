package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemActivityRepository extends JpaRepository<ItemActivity, Long> {
    List<ItemActivity> findByItemIdAndUserId(Long itemId, Long userId);

    @Query(value = """
        SELECT ia.id, ia.item_id, ia.type, ia.user_id, ia.date, ia.note, ia.status, ia.created_at,
               i.title AS item_title, i.seo_url
        FROM item_activities ia
        JOIN items i ON i.id = ia.item_id
        WHERE ia.user_id = :userId
        ORDER BY ia.date DESC, ia.created_at DESC
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findByUserIdWithItemInfo(@Param("userId") Long userId);
}
