package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemUserAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemUserActionRepository extends JpaRepository<ItemUserAction, Long> {

    @Query("""
        SELECT new map(i.id as id, i.title as title, i.image as image, i.shortContent as shortContent)
        FROM ItemUserAction iua JOIN Item i ON i.id = iua.itemId
        WHERE iua.type = 'fav' AND iua.userId = :userId AND iua.value = '1'
        ORDER BY iua.id DESC
        """)
    List<java.util.Map<String, Object>> findFavedItemsByUser(@Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);

    @Query("""
        SELECT new map(i.id as id, i.title as title, i.image as image, i.shortContent as shortContent, iua.value as value)
        FROM ItemUserAction iua JOIN Item i ON i.id = iua.itemId
        WHERE iua.type = 'rating' AND iua.userId = :userId
        ORDER BY iua.id DESC
        """)
    List<java.util.Map<String, Object>> findRatedItemsByUser(@Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);

    @Query("""
        SELECT AVG(CAST(iua.value AS double))
        FROM ItemUserAction iua
        JOIN Item i ON i.id = iua.itemId
        WHERE iua.type = 'rating' AND i.userId = :userId
        """)
    Double avgRatingByOwner(@Param("userId") Long userId);

    @Query("SELECT COUNT(iua) FROM ItemUserAction iua WHERE iua.itemId = :itemId AND iua.type = 'fav' AND iua.value = '1'")
    Long countFav(@Param("itemId") Long itemId);

    @Query("SELECT COUNT(iua) FROM ItemUserAction iua WHERE iua.itemId = :itemId AND iua.type = 'reg'")
    Long countReg(@Param("itemId") Long itemId);

    @Query("SELECT AVG(CAST(iua.value AS double)) FROM ItemUserAction iua WHERE iua.itemId = :itemId AND iua.type = 'rating'")
    Double avgRating(@Param("itemId") Long itemId);

    @Query("SELECT iua FROM ItemUserAction iua WHERE iua.itemId = :itemId AND iua.userId = :userId AND iua.type = 'fav'")
    java.util.Optional<ItemUserAction> findFavByItemAndUser(@Param("itemId") Long itemId, @Param("userId") Long userId);

    @Query(value = """
        SELECT iua.*, CASE WHEN u.name = 'Admin' THEN 'anyLEARN' ELSE u.name END AS user_name,
               u.id AS user_id, u.image AS user_image
        FROM item_user_actions iua
        JOIN users u ON u.id = iua.user_id
        WHERE iua.item_id = :itemId AND iua.type = 'rating'
        ORDER BY iua.id DESC
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findReviewsByItemId(@Param("itemId") Long itemId);
}
