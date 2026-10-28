package com.anylearn.backend.service.video;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.recommend.PathwayService;
import com.anylearn.backend.service.recommend.RecommendationRules;
import com.anylearn.backend.service.recommend.RecommendationService;
import com.anylearn.backend.service.search.ItemVisibility;
import com.anylearn.backend.service.today.Learner;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * "Học gần xong thì gợi ý khóa mới" (plan 17.6). When a learner passes `video/suggest_percent` of a video course and
 * when they finish it, the account gets one notification per milestone (`video_suggest`, claimed in
 * `lifecycle_messages`), and the learning page shows suggestion cards from {@link #suggestions}: the next pathway step,
 * other courses of the same partner, then courses sharing tags; owned and dismissed ones are left out.
 */
@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
public class VideoMilestoneService {

    private final JdbcTemplate jdbc;
    private final NotificationService notifications;
    private final RecommendationService recommendations;
    private final PathwayService pathways;

    /** Called once a progress save crossed a milestone (the suggest percent or 100). Never throws. */
    public void reached(User account, Learner learner, long itemId, int milestone) {
        try {
            String key = "video-milestone:" + learner.id() + ":" + itemId + ":" + milestone;
            int claimed = jdbc.update("INSERT IGNORE INTO lifecycle_messages (enrollment_id, learner_id, user_id, stage, dedup_key) VALUES (NULL, ?, ?, ?, ?)",
                    learner.id(), account.getId(), milestone >= 100 ? "video_done" : "video_suggest", key);
            if (claimed == 0) return;
            String title = jdbc.queryForList("SELECT title FROM items WHERE id = ?", String.class, itemId).stream().findFirst().orElse("khóa học");
            String who = learner.self() ? "Bạn" : learner.name();
            List<Map<String, Object>> picks = suggestions(account, learner.id(), itemId, 1);
            String next = picks.isEmpty() ? "" : " Khóa nên học tiếp: " + picks.get(0).get("title") + ".";
            String head = milestone >= 100 ? "🎉 " + who + " đã học xong " + title : who + " đã học được " + milestone + "% " + title;
            notifications.createNotification(account.getId(), "video_suggest", head,
                    (milestone >= 100 ? "Chúc mừng! " : "Sắp xong rồi! ") + (next.isEmpty() ? "Xem các khóa gợi ý để học tiếp." : next.trim()),
                    "/learn/" + itemId + "?learner=" + learner.id());
        } catch (Exception e) {
            log.warn("Video milestone {} of learner {} item {} not sent: {}", milestone, learner.id(), itemId, e.getMessage());
        }
    }

    /** Suggestion cards after a video course, best first (same shape as the other suggestion cards, source `video`). */
    public List<Map<String, Object>> suggestions(User account, long learnerId, long itemId, int limit) {
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        Map<Long, String> reasons = new HashMap<>();
        try {
            for (PathwayService.Chain chain : pathways.chainsOf(itemId)) {
                int at = -1;
                for (int i = 0; i < chain.steps().size(); i++) if (chain.steps().get(i).contains(itemId)) at = i;
                for (int i = at + 1; i >= 1 && i < chain.steps().size() && i <= at + 2; i++) {
                    for (Long id : chain.steps().get(i)) {
                        if (ids.add(id)) reasons.put(id, "Bước tiếp theo của lộ trình " + chain.title());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Video suggestions: pathway of item {} failed: {}", itemId, e.getMessage());
        }
        jdbc.queryForList("SELECT i.id FROM items i WHERE i.user_id = (SELECT user_id FROM items WHERE id = ?) AND i.id <> ? AND " + ItemVisibility.VISIBLE_ITEM_SQL +
                " ORDER BY (i.subtype = 'video') DESC, i.popularity_score DESC LIMIT 12", Long.class, itemId, itemId).forEach(id -> {
            if (ids.add(id)) reasons.put(id, "Cùng đơn vị dạy");
        });
        jdbc.queryForList("SELECT i.id FROM items i JOIN item_tags t ON t.item_id = i.id WHERE t.tag_id IN (SELECT tag_id FROM item_tags WHERE item_id = ?) " +
                "AND i.id <> ? AND " + ItemVisibility.VISIBLE_ITEM_SQL + " GROUP BY i.id ORDER BY COUNT(*) DESC, MAX(i.popularity_score) DESC LIMIT 12", Long.class, itemId, itemId).forEach(id -> {
            if (ids.add(id)) reasons.put(id, "Cùng chủ đề");
        });
        List<Map<String, Object>> cards = recommendations.cardsFor(account, learnerId, new ArrayList<>(ids), reasons);
        List<Map<String, Object>> out = new ArrayList<>();
        Set<Long> seen = new java.util.HashSet<>();
        for (Map<String, Object> card : cards) {
            if (out.size() >= limit) break;
            if (!seen.add(((Number) card.get("itemId")).longValue())) continue;
            card.put("source", RecommendationRules.VIDEO);
            card.put("reasonCode", "video_next");
            out.add(card);
        }
        return out;
    }
}
