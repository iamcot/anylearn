package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {

    Optional<Collection> findBySlug(String slug);

    List<Collection> findAllByOrderBySortOrderAscIdAsc();

    @Query(value = "SELECT item_id FROM collection_items WHERE collection_id = :id ORDER BY sort_order, item_id", nativeQuery = true)
    List<Long> findItemIds(@Param("id") Long collectionId);

    @Query(value = "SELECT collection_id AS collectionId, COUNT(*) AS itemCount FROM collection_items GROUP BY collection_id", nativeQuery = true)
    List<ItemCount> countItems();

    @Modifying
    @Query(value = "DELETE FROM collection_items WHERE collection_id = :id", nativeQuery = true)
    void deleteItems(@Param("id") Long collectionId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO collection_items (collection_id, item_id, sort_order) VALUES (:id, :itemId, :sort)", nativeQuery = true)
    void addItem(@Param("id") Long collectionId, @Param("itemId") Long itemId, @Param("sort") int sortOrder);

    interface ItemCount {
        Long getCollectionId();
        Long getItemCount();
    }
}
