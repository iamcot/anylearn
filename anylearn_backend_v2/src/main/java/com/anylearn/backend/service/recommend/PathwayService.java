package com.anylearn.backend.service.recommend;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.collections.CollectionRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Pathways (plan 08.1): an ordered chain of courses an admin builds ("Bóng đá U13 → U15 → U17"). A learner's progress is
 * never stored: a step counts as done when the learner has an enrollment or order for that course.
 */
@Service
@RequiredArgsConstructor
public class PathwayService {

    private final JdbcTemplate jdbc;
    private final ItemRepository itemRepository;

    /** What an admin sends for one pathway. `steps` replaces the list; its order is the order of the chain. */
    public record Draft(String title, String slug, String subtitle, String cover, Long partnerId, Boolean active, List<Step> steps) {}

    public record Step(Long itemId, String note) {}

    // ── Back office ──────────────────────────────────────────────────────────

    public List<Map<String, Object>> listForAdmin() {
        return jdbc.queryForList("""
                SELECT p.id, p.slug, p.title, p.subtitle, p.cover, p.partner_id AS partnerId, p.is_active = 1 AS active,
                       (SELECT COUNT(*) FROM pathway_steps s WHERE s.pathway_id = p.id) AS stepCount
                FROM pathways p ORDER BY p.id DESC""");
    }

    public Optional<Map<String, Object>> getForAdmin(Long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, slug, title, subtitle, cover, partner_id AS partnerId, is_active = 1 AS active FROM pathways WHERE id = ?", id);
        if (rows.isEmpty()) return Optional.empty();
        Map<String, Object> map = new LinkedHashMap<>(rows.get(0));
        map.put("steps", stepsOf(id, false));
        return Optional.of(map);
    }

    @Transactional
    public Long save(Long id, Draft draft) {
        String title = draft.title() == null ? "" : draft.title().trim();
        if (title.isEmpty()) throw new IllegalArgumentException("Thiếu tên lộ trình");
        String slug = draft.slug() == null || draft.slug().isBlank() ? CollectionRules.slugOf(title) : draft.slug().trim();
        if (!CollectionRules.isValidSlug(slug)) throw new IllegalArgumentException("Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang");
        Integer clash = jdbc.queryForObject("SELECT COUNT(*) FROM pathways WHERE slug = ? AND id <> ?", Integer.class, slug, id == null ? -1L : id);
        if (clash != null && clash > 0) throw new IllegalArgumentException("Đường dẫn \"" + slug + "\" đã dùng cho lộ trình khác");
        int active = draft.active() == null || draft.active() ? 1 : 0;

        Long pathwayId = id;
        if (id == null) {
            jdbc.update("INSERT INTO pathways (slug, title, subtitle, cover, partner_id, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                    slug, title, blank(draft.subtitle()), blank(draft.cover()), draft.partnerId(), active);
            pathwayId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        } else {
            int rows = jdbc.update("UPDATE pathways SET slug = ?, title = ?, subtitle = ?, cover = ?, partner_id = ?, is_active = ? WHERE id = ?",
                    slug, title, blank(draft.subtitle()), blank(draft.cover()), draft.partnerId(), active, id);
            if (rows == 0 && jdbc.queryForObject("SELECT COUNT(*) FROM pathways WHERE id = ?", Integer.class, id) == 0) {
                throw new IllegalArgumentException("Không tìm thấy lộ trình");
            }
        }
        if (draft.steps() != null) replaceSteps(pathwayId, draft.steps());
        return pathwayId;
    }

    private void replaceSteps(Long pathwayId, List<Step> requested) {
        List<Long> ids = requested.stream().map(Step::itemId).filter(java.util.Objects::nonNull).distinct().toList();
        Set<Long> existing = itemRepository.findAllById(ids).stream().map(Item::getId).collect(Collectors.toSet());
        jdbc.update("DELETE FROM pathway_steps WHERE pathway_id = ?", pathwayId);
        Set<Long> seen = new java.util.HashSet<>();
        int stepNo = 1;
        for (Step step : requested) {
            if (step.itemId() == null || !existing.contains(step.itemId()) || !seen.add(step.itemId())) continue;
            jdbc.update("INSERT INTO pathway_steps (pathway_id, item_id, step_no, note) VALUES (?, ?, ?, ?)",
                    pathwayId, step.itemId(), stepNo++, blank(step.note()));
        }
    }

    @Transactional
    public void delete(Long id) {
        jdbc.update("DELETE FROM pathway_steps WHERE pathway_id = ?", id);
        jdbc.update("DELETE FROM pathways WHERE id = ?", id);
    }

    // ── Visitors and the engine ──────────────────────────────────────────────

    /** An active pathway with its courses; `owned` (the learner's course ids) adds the progress. */
    public Optional<Map<String, Object>> getPublic(String slug, Set<Long> owned) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, slug, title, subtitle, cover FROM pathways WHERE slug = ? AND is_active = 1", slug);
        return rows.isEmpty() ? Optional.empty() : Optional.of(withSteps(rows.get(0), owned));
    }

    /** The active pathways a course belongs to, each with the learner's progress. */
    public List<Map<String, Object>> forItem(Long itemId, Set<Long> owned) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT p.id, p.slug, p.title, p.subtitle, p.cover FROM pathways p
                JOIN pathway_steps s ON s.pathway_id = p.id WHERE s.item_id = ? AND p.is_active = 1 ORDER BY p.id""", itemId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> map = withSteps(row, owned);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> steps = (List<Map<String, Object>>) map.get("steps");
            steps.stream().filter(step -> itemId.equals(((Number) step.get("itemId")).longValue())).findFirst()
                    .ifPresent(step -> map.put("stepNo", step.get("stepNo")));
            result.add(map);
        }
        return result;
    }

    private Map<String, Object> withSteps(Map<String, Object> row, Set<Long> owned) {
        Map<String, Object> map = new LinkedHashMap<>(row);
        Long id = ((Number) row.get("id")).longValue();
        List<Map<String, Object>> steps = stepsOf(id, true);
        steps.forEach(step -> step.put("done", owned.contains(((Number) step.get("itemId")).longValue())));
        map.put("steps", steps);
        List<Long> ids = steps.stream().map(step -> ((Number) step.get("itemId")).longValue()).toList();
        map.put("doneSteps", RecommendationRules.doneSteps(ids, owned));
        map.put("totalSteps", ids.size());
        return map;
    }

    /** Steps in order; for visitors only courses that are switched on. */
    private List<Map<String, Object>> stepsOf(Long pathwayId, boolean liveOnly) {
        return jdbc.queryForList("SELECT s.step_no AS stepNo, s.item_id AS itemId, s.note, i.title, i.image, i.price, i.seo_url AS seoUrl FROM pathway_steps s"
                + " JOIN items i ON i.id = s.item_id WHERE s.pathway_id = ?"
                + (liveOnly ? " AND i.status = 1 AND i.user_status = 1" : "") + " ORDER BY s.step_no", pathwayId);
    }

    /** An active pathway a course is in, with its courses in order: the chain the engine walks. */
    public record Chain(Long pathwayId, String title, List<Long> itemIds) {}

    public List<Chain> chainsOf(Long itemId) {
        List<Chain> chains = new ArrayList<>();
        jdbc.queryForList("SELECT p.id, p.title FROM pathways p JOIN pathway_steps s ON s.pathway_id = p.id WHERE s.item_id = ? AND p.is_active = 1", itemId)
                .forEach(row -> {
                    Long pathwayId = ((Number) row.get("id")).longValue();
                    chains.add(new Chain(pathwayId, String.valueOf(row.get("title")),
                            jdbc.queryForList("SELECT item_id FROM pathway_steps WHERE pathway_id = ? ORDER BY step_no", Long.class, pathwayId)));
                });
        return chains;
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
