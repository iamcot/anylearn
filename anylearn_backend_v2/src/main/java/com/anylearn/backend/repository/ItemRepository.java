package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query(value = """
        SELECT * FROM items
        WHERE id IN (:ids) AND status = 1 AND user_status = 1
        ORDER BY FIND_IN_SET(id, :idsCsv)
        """, nativeQuery = true)
    List<Item> findByIdsOrdered(@Param("ids") List<Long> ids, @Param("idsCsv") String idsCsv);

    List<Item> findByItemCategoryIdAndStatusAndUserStatusOrderByBoostScoreDesc(
            Integer categoryId, Byte status, Byte userStatus,
            org.springframework.data.domain.Pageable pageable);

    @Query("""
        SELECT i FROM Item i
        WHERE i.status = 1 AND i.userStatus = 1 AND i.id != :itemId AND i.itemId IS NULL
        ORDER BY i.isHot DESC, i.id DESC
        """)
    List<Item> findHotItems(@Param("itemId") Long itemId, org.springframework.data.domain.Pageable pageable);
    @Query("""
        SELECT i FROM Item i
        WHERE i.userId = :userId AND i.status = 1 AND i.userStatus = 1
        AND i.id != :itemId AND i.itemId IS NULL
        ORDER BY i.boostScore DESC, i.id DESC
        """)
    List<Item> findByAuthor(@Param("userId") Long userId, @Param("itemId") Long itemId,
                            org.springframework.data.domain.Pageable pageable);
}
