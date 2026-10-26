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
        SELECT i.* FROM items i
        WHERE i.id IN (:ids) AND i.status = 1 AND i.user_status = 1
          AND EXISTS (SELECT 1 FROM users a WHERE a.id = i.user_id AND a.status = 1 AND a.is_signed = 99)
        ORDER BY FIND_IN_SET(i.id, :idsCsv)
        """, nativeQuery = true)
    List<Item> findByIdsOrdered(@Param("ids") List<Long> ids, @Param("idsCsv") String idsCsv);

    @Query("""
        SELECT i FROM Item i
        WHERE i.itemCategoryId = :categoryId AND i.status = 1 AND i.userStatus = 1
        AND EXISTS (SELECT 1 FROM User a WHERE a.id = i.userId AND a.status = 1 AND a.isSigned = 99)
        ORDER BY i.boostScore DESC
        """)
    List<Item> findLiveByCategory(@Param("categoryId") Integer categoryId, org.springframework.data.domain.Pageable pageable);

    @Query("""
        SELECT i FROM Item i
        WHERE i.status = 1 AND i.userStatus = 1 AND i.id != :itemId AND i.itemId IS NULL
        AND EXISTS (SELECT 1 FROM User a WHERE a.id = i.userId AND a.status = 1 AND a.isSigned = 99)
        ORDER BY i.isHot DESC, i.id DESC
        """)
    List<Item> findHotItems(@Param("itemId") Long itemId, org.springframework.data.domain.Pageable pageable);
    @Query("""
        SELECT i FROM Item i
        WHERE i.userId = :userId AND i.status = 1 AND i.userStatus = 1
        AND EXISTS (SELECT 1 FROM User a WHERE a.id = i.userId AND a.status = 1 AND a.isSigned = 99)
        AND i.id != :itemId AND i.itemId IS NULL
        ORDER BY i.boostScore DESC, i.id DESC
        """)
    List<Item> findByAuthor(@Param("userId") Long userId, @Param("itemId") Long itemId,
                            org.springframework.data.domain.Pageable pageable);

    List<Item> findByUserId(Long userId);
}
