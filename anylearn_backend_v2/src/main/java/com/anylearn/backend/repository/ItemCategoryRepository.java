package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemCategoryRepository extends JpaRepository<ItemCategory, Long> {

    @Query(value = """
        SELECT c.id, c.url, c.title
        FROM items_categories ic
        JOIN categories c ON c.id = ic.category_id
        WHERE ic.item_id = :itemId
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findCategoriesByItemId(@Param("itemId") Long itemId);

    @Query(value = """
        SELECT c.url FROM items_categories ic
        JOIN categories c ON c.id = ic.category_id
        WHERE ic.item_id = :itemId LIMIT 1
        """, nativeQuery = true)
    String findPrimaryCategoryUrl(@Param("itemId") Long itemId);

    @Query(value = """
        SELECT c.url FROM items_categories ic
        JOIN categories c ON c.id = ic.category_id
        WHERE ic.item_id = :itemId
        """, nativeQuery = true)
    List<String> findAllCategoryUrlsByItemId(@Param("itemId") Long itemId);
}
