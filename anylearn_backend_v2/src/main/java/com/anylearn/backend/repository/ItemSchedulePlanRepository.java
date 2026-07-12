package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemSchedulePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemSchedulePlanRepository extends JpaRepository<ItemSchedulePlan, Long> {

    @Query(value = """
        SELECT isp.*, ul.id AS location_id, ul.title AS location_title, ul.address
        FROM item_schedule_plans isp
        LEFT JOIN user_locations ul ON ul.id = isp.user_location_id
        WHERE isp.item_id = :itemId
        ORDER BY isp.date_start
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findPlansWithLocation(@Param("itemId") Long itemId);
}
