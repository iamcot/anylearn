package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query(value = """
            SELECT t.id, t.name, t.tag_group AS tagGroup, t.status, t.sort_order AS sortOrder,
                   (SELECT COUNT(*) FROM item_tags it WHERE it.tag_id = t.id) AS itemCount
            FROM tags t
            WHERE (:group IS NULL OR t.tag_group = :group)
              AND (:q IS NULL OR t.name LIKE CONCAT('%', :q, '%'))
            ORDER BY t.tag_group, t.sort_order, t.name
            """, nativeQuery = true)
    List<Map<String, Object>> findForAdmin(@Param("group") String group, @Param("q") String q);

    @Query("SELECT t FROM Tag t WHERE t.id IN :ids")
    List<Tag> findByIds(@Param("ids") List<Long> ids);

    @Query(value = "SELECT t.* FROM tags t JOIN item_tags it ON it.tag_id = t.id WHERE it.item_id = :itemId "
            + "ORDER BY t.sort_order, t.name", nativeQuery = true)
    List<Tag> findByItemId(@Param("itemId") Long itemId);

    @Query(value = "SELECT t.name FROM tags t JOIN item_tags it ON it.tag_id = t.id "
            + "WHERE it.item_id = :itemId AND t.status = 1 ORDER BY t.sort_order, t.name", nativeQuery = true)
    List<String> findActiveNamesByItemId(@Param("itemId") Long itemId);

    /** Active tags that at least one course uses, most used first: what the search box suggests. */
    @Query(value = """
            SELECT t.name FROM tags t JOIN item_tags it ON it.tag_id = t.id
            WHERE t.status = 1 AND (:q IS NULL OR t.name LIKE CONCAT('%', :q, '%'))
            GROUP BY t.id, t.name ORDER BY COUNT(*) DESC, t.name LIMIT :limit
            """, nativeQuery = true)
    List<String> findUsedNames(@Param("q") String q, @Param("limit") int limit);

    /** Active tags that at least one course uses, with ids: the tag filter of the search. */
    @Query(value = """
            SELECT t.id AS id, t.name AS name, t.tag_group AS tagGroup FROM tags t JOIN item_tags it ON it.tag_id = t.id
            WHERE t.status = 1 GROUP BY t.id, t.name, t.tag_group ORDER BY COUNT(*) DESC, t.name LIMIT :limit
            """, nativeQuery = true)
    List<UsedTag> findUsedTags(@Param("limit") int limit);

    interface UsedTag {
        Long getId();
        String getName();
        String getTagGroup();
    }

    @Query(value = "SELECT DISTINCT item_id FROM item_tags WHERE tag_id = :tagId", nativeQuery = true)
    List<Long> findItemIdsByTagId(@Param("tagId") Long tagId);

    @Modifying
    @Query(value = "DELETE FROM item_tags WHERE item_id = :itemId", nativeQuery = true)
    void deleteLinksOfItem(@Param("itemId") Long itemId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO item_tags (item_id, tag_id) VALUES (:itemId, :tagId)", nativeQuery = true)
    void addLink(@Param("itemId") Long itemId, @Param("tagId") Long tagId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO item_tags (item_id, tag_id) "
            + "SELECT item_id, :intoId FROM item_tags WHERE tag_id = :fromId", nativeQuery = true)
    void copyLinks(@Param("fromId") Long fromId, @Param("intoId") Long intoId);

    @Modifying
    @Query(value = "DELETE FROM item_tags WHERE tag_id = :tagId", nativeQuery = true)
    void deleteLinksOfTag(@Param("tagId") Long tagId);
}
