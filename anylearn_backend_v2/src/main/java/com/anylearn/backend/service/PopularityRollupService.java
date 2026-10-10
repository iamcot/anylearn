package com.anylearn.backend.service;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PopularityRollupService {

    private final EntityManager em;

    /**
     * Runs every 30 minutes.
     * Formula — items:
     *   is_hot×350 + LEAST(orders×10, 30) + LEAST(cart_events×5, 30)
     *   + LEAST(FLOOR(views×1.5), 100) + LEAST(fav×5, 50) + LEAST(FLOOR(avgRating×10), 50)
     *   + LEAST(boost_score, 50)
     * Formula — users:
     *   is_hot×350 + LEAST(profile_views×2, 100)
     *   + LEAST(sum of owned item popularity_scores, 500) + LEAST(boost_score, 50)
     */
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    @Transactional
    public void rollup() {
        rollupItems();
        rollupUsers();
    }

    private void rollupItems() {
        int updated = em.createNativeQuery("""
            UPDATE items i
            SET i.popularity_score =
                (CASE WHEN i.is_hot = 1 THEN 350 ELSE 0 END)
              + LEAST(
                    (SELECT COUNT(*) FROM orders o
                     JOIN order_details od ON od.order_id = o.id
                     WHERE od.item_id = i.id AND o.status = 'delivered') * 10,
                    30)
              + LEAST(
                    (SELECT COUNT(*) FROM item_events ie
                     WHERE ie.item_id = i.id AND ie.type = 'cart') * 5,
                    30)
              + LEAST(
                    FLOOR((SELECT COUNT(*) FROM item_events ie
                           WHERE ie.item_id = i.id AND ie.type = 'view') * 1.5),
                    100)
              + LEAST(
                    (SELECT COUNT(*) FROM item_user_actions iua
                     WHERE iua.item_id = i.id AND iua.type = 'fav' AND iua.value = '1') * 5,
                    50)
              + LEAST(
                    FLOOR(COALESCE((SELECT AVG(CAST(iua2.value AS DECIMAL))
                                    FROM item_user_actions iua2
                                    WHERE iua2.item_id = i.id AND iua2.type = 'rating'), 0) * 10),
                    50)
              + LEAST(COALESCE(i.boost_score, 0), 50)
            WHERE i.is_test = 0
            """).executeUpdate();
        log.debug("Popularity rollup — items updated: {}", updated);
    }

    private void rollupUsers() {
        int updated = em.createNativeQuery("""
            UPDATE users u
            SET u.popularity_score =
                (CASE WHEN u.is_hot = 1 THEN 350 ELSE 0 END)
              + LEAST(
                    (SELECT COUNT(*) FROM user_events ue
                     WHERE ue.user_id = u.id AND ue.type = 'view') * 2,
                    100)
              + LEAST(
                    COALESCE((SELECT SUM(i.popularity_score) FROM items i
                              WHERE i.user_id = u.id AND i.is_test = 0), 0),
                    500)
              + LEAST(COALESCE(u.boost_score, 0), 50)
            WHERE u.is_test = 0
            """).executeUpdate();
        log.debug("Popularity rollup — users updated: {}", updated);
    }
}
