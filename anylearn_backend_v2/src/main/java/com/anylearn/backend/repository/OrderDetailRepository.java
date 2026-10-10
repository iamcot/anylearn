package com.anylearn.backend.repository;

import com.anylearn.backend.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {

    List<OrderDetail> findByOrderId(Long orderId);

    List<OrderDetail> findByUserIdOrderByIdDesc(Long userId);

    boolean existsByUserId(Long userId);

    @Query("""
        SELECT new map(i.id as id, i.title as title, i.image as image, i.shortContent as shortContent)
        FROM OrderDetail od JOIN Item i ON i.id = od.itemId
        WHERE od.userId = :userId
        ORDER BY od.id DESC
        """)
    List<java.util.Map<String, Object>> findRegisteredItemsByUser(@Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);
    List<OrderDetail> findByItemIdOrderByIdDesc(Long itemId);

    long countDistinctUserIdByItemId(Long itemId);

    @Query(value = "SELECT COUNT(*) FROM order_details od JOIN orders o ON o.id = od.order_id WHERE od.item_id = :id AND o.status = 'delivered'",
           nativeQuery = true)
    int countDeliveredByItemId(@Param("id") Long id);

    @Query(value = "SELECT COUNT(*) FROM order_details od JOIN orders o ON o.id = od.order_id WHERE od.user_id = :userId AND od.item_id = :itemId AND o.status = 'delivered'",
           nativeQuery = true)
    int existsDeliveredByUserIdAndItemId(@Param("userId") Long userId, @Param("itemId") Long itemId);
}
