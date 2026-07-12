package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByStatusOrderByIdAsc(Byte status);

    @Query(value = """
        SELECT DISTINCT c.* FROM categories c
        JOIN items_categories ic ON ic.category_id = c.id
        JOIN items i ON i.id = ic.item_id AND i.status = 1 AND i.user_status = 1
        WHERE c.status = 1
        ORDER BY c.id ASC
        """, nativeQuery = true)
    List<Category> findCategoriesWithActiveItems();
}
