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

    /** One step: the courses a learner can choose from (`itemIds`; `itemId` is the old single-course form) and a note. */
    public record Step(Long itemId, List<Long> itemIds, String note) {
        List<Long> courses() {
            if (itemIds != null) return itemIds;
            return itemId == null ? List.of() : List.of(itemId);
        }
    }

    // ── Back office ──────────────────────────────────────────────────────────

    public List<Map<String, Object>> listForAdmin() {
        return jdbc.queryForList("""
                SELECT p.id, p.slug, p.title, p.subtitle, p.cover, p.partner_id AS partnerId, p.is_active = 1 AS active,
                       (SELECT COUNT(DISTINCT s.step_no) FROM pathway_steps s WHERE s.pathway_id = p.id) AS stepCount
                FROM pathways p ORDER BY p.id DESC""");
    }

    public Optional<Map<String, Object>> getForAdmin(Long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, slug, title, subtitle, cover, partner_id AS partnerId, is_active = 1 AS active FROM pathways WHERE id = ?", id);
        if (rows.isEmpty()) return Optional.empty();
        Map<String, Object> map = new LinkedHashMap<>(rows.get(0));
        map.put("steps", groupSteps(stepRows(id, false)).stream().map(group -> {
            Map<String, Object> step = new LinkedHashMap<>(group);
            step.put("itemIds", itemIdsOf(group));
            return step;
        }).toList());
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
        List<Long> ids = requested.stream().flatMap(step -> step.courses().stream()).filter(java.util.Objects::nonNull).distinct().toList();
        Set<Long> existing = itemRepository.findAllById(ids).stream().map(Item::getId).collect(Collectors.toSet());
        jdbc.update("DELETE FROM pathway_steps WHERE pathway_id = ?", pathwayId);
        Set<Long> seen = new java.util.HashSet<>();
        int stepNo = 1;
        for (Step step : requested) {
            List<Long> courses = step.courses().stream().filter(id -> id != null && existing.contains(id) && seen.add(id)).toList();
            if (courses.isEmpty()) continue;
            int order = 1;
            for (Long itemId : courses) {
                jdbc.update("INSERT INTO pathway_steps (pathway_id, item_id, step_no, item_order, note) VALUES (?, ?, ?, ?, ?)",
                        pathwayId, itemId, stepNo, order++, blank(step.note()));
            }
            stepNo++;
        }
    }

    @Transactional
    public void delete(Long id) {
        jdbc.update("DELETE FROM pathway_steps WHERE pathway_id = ?", id);
        jdbc.update("DELETE FROM pathways WHERE id = ?", id);
    }

    // ── Visitors and the engine ──────────────────────────────────────────────

    /** An active pathway with its steps; with a learner (`owned` = their course ids) each step says done / skipped and the next one. */
    public Optional<Map<String, Object>> getPublic(String slug, Long learnerId, Set<Long> owned) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, slug, title, subtitle, cover FROM pathways WHERE slug = ? AND is_active = 1", slug);
        return rows.isEmpty() ? Optional.empty() : Optional.of(withSteps(rows.get(0), learnerId, owned));
    }

    /** The active pathways a course belongs to, each with the learner's progress. */
    public List<Map<String, Object>> forItem(Long itemId, Long learnerId, Set<Long> owned) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT DISTINCT p.id, p.slug, p.title, p.subtitle, p.cover FROM pathways p
                JOIN pathway_steps s ON s.pathway_id = p.id WHERE s.item_id = ? AND p.is_active = 1 ORDER BY p.id""", itemId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> map = withSteps(row, learnerId, owned);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> steps = (List<Map<String, Object>>) map.get("steps");
            steps.stream().filter(step -> itemIdsOf(step).contains(itemId)).findFirst().ifPresent(step -> map.put("stepNo", step.get("stepNo")));
            result.add(map);
        }
        return result;
    }

    /** "Đặt lại": the learner goes back to a step they skipped. Returns false when the pathway or step does not exist. */
    @Transactional
    public boolean restart(String slug, Long learnerId, Long accountId, int stepNo) {
        List<Long> ids = jdbc.queryForList("SELECT id FROM pathways WHERE slug = ? AND is_active = 1", Long.class, slug);
        if (ids.isEmpty()) return false;
        Integer steps = jdbc.queryForObject("SELECT COUNT(*) FROM pathway_steps WHERE pathway_id = ? AND step_no = ?", Integer.class, ids.get(0), stepNo);
        if (steps == null || steps == 0) return false;
        jdbc.update("INSERT IGNORE INTO pathway_restarts (learner_id, pathway_id, step_no, user_id) VALUES (?, ?, ?, ?)", learnerId, ids.get(0), stepNo, accountId);
        return true;
    }

    private Map<String, Object> withSteps(Map<String, Object> row, Long learnerId, Set<Long> owned) {
        Map<String, Object> map = new LinkedHashMap<>(row);
        Long id = ((Number) row.get("id")).longValue();
        List<Map<String, Object>> groups = groupSteps(stepRows(id, true));
        List<List<Long>> ids = groups.stream().map(PathwayService::itemIdsOf).toList();
        Set<Integer> restarted = restartedIndexes(learnerId, id, groups);
        Set<Integer> skipped = RecommendationRules.skippedSteps(ids, owned, restarted);
        java.util.OptionalInt next = learnerId == null ? java.util.OptionalInt.empty() : RecommendationRules.nextStepIndex(ids, owned, restarted);
        Map<Long, Long> partnerOf = partnersOf(ids.stream().flatMap(List::stream).toList());

        List<Map<String, Object>> steps = new ArrayList<>();
        for (int i = 0; i < groups.size(); i++) {
            Map<String, Object> step = new LinkedHashMap<>(groups.get(i));
            Set<Long> reference = referencePartners(ids, i, owned, partnerOf);
            List<Long> ordered = owned.isEmpty() ? ids.get(i) : RecommendationRules.relatedFirst(ids.get(i), partnerOf, reference);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) groups.get(i).get("items");
            List<Map<String, Object>> sorted = new ArrayList<>();
            for (Long itemId : ordered) {
                items.stream().filter(item -> itemId.equals(((Number) item.get("itemId")).longValue())).findFirst().ifPresent(item -> {
                    Map<String, Object> copy = new LinkedHashMap<>(item);
                    copy.put("owned", owned.contains(itemId));
                    copy.put("related", !owned.isEmpty() && reference.contains(partnerOf.get(itemId)));
                    sorted.add(copy);
                });
            }
            step.put("items", sorted);
            step.put("done", RecommendationRules.hasStep(ids.get(i), owned));
            step.put("skipped", skipped.contains(i));
            step.put("restarted", restarted.contains(i));
            step.put("next", next.isPresent() && next.getAsInt() == i);
            steps.add(step);
        }
        map.put("steps", steps);
        map.put("doneSteps", RecommendationRules.doneSteps(ids, owned));
        map.put("totalSteps", ids.size());
        return map;
    }

    /** Partners of the courses the learner has in the nearest earlier step they have: the courses of the same partners come first. */
    private static Set<Long> referencePartners(List<List<Long>> steps, int index, Set<Long> owned, Map<Long, Long> partnerOf) {
        for (int j = index - 1; j >= 0; j--) {
            Set<Long> partners = steps.get(j).stream().filter(owned::contains).map(partnerOf::get).filter(java.util.Objects::nonNull).collect(Collectors.toSet());
            if (!partners.isEmpty()) return partners;
        }
        return Set.of();
    }

    private Set<Integer> restartedIndexes(Long learnerId, Long pathwayId, List<Map<String, Object>> groups) {
        if (learnerId == null) return Set.of();
        Set<Integer> numbers = new java.util.HashSet<>(jdbc.queryForList(
                "SELECT step_no FROM pathway_restarts WHERE learner_id = ? AND pathway_id = ?", Integer.class, learnerId, pathwayId));
        Set<Integer> indexes = new java.util.HashSet<>();
        for (int i = 0; i < groups.size(); i++) {
            if (numbers.contains(((Number) groups.get(i).get("stepNo")).intValue())) indexes.add(i);
        }
        return indexes;
    }

    /** Course id -> the partner (author) who runs it. */
    public Map<Long, Long> partnersOf(java.util.Collection<Long> itemIds) {
        Map<Long, Long> result = new java.util.HashMap<>();
        if (itemIds.isEmpty()) return result;
        itemRepository.findAllById(itemIds).forEach(item -> result.put(item.getId(), item.getUserId()));
        return result;
    }

    /** One row per course; for visitors only courses that are switched on. */
    private List<Map<String, Object>> stepRows(Long pathwayId, boolean liveOnly) {
        return jdbc.queryForList("SELECT s.step_no AS stepNo, s.note, s.item_id AS itemId, i.title, i.image, i.price, i.seo_url AS seoUrl FROM pathway_steps s"
                + " JOIN items i ON i.id = s.item_id WHERE s.pathway_id = ?"
                + (liveOnly ? " AND i.status = 1 AND i.user_status = 1" : "") + " ORDER BY s.step_no, s.item_order, s.item_id", pathwayId);
    }

    /** Rows of the same `stepNo` become one step: {stepNo, note, items: [...]}. */
    private static List<Map<String, Object>> groupSteps(List<Map<String, Object>> rows) {
        Map<Integer, Map<String, Object>> groups = new java.util.TreeMap<>();
        for (Map<String, Object> row : rows) {
            int stepNo = ((Number) row.get("stepNo")).intValue();
            Map<String, Object> group = groups.computeIfAbsent(stepNo, no -> {
                Map<String, Object> created = new LinkedHashMap<>();
                created.put("stepNo", no);
                created.put("note", row.get("note"));
                created.put("items", new ArrayList<Map<String, Object>>());
                return created;
            });
            Map<String, Object> item = new LinkedHashMap<>(row);
            item.remove("stepNo");
            item.remove("note");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) group.get("items");
            items.add(item);
        }
        return new ArrayList<>(groups.values());
    }

    @SuppressWarnings("unchecked")
    static List<Long> itemIdsOf(Map<String, Object> group) {
        return ((List<Map<String, Object>>) group.get("items")).stream().map(item -> ((Number) item.get("itemId")).longValue()).toList();
    }

    /** An active pathway a course is in, with its steps in order (each step a list of alternative courses): the chain the engine walks. */
    public record Chain(Long pathwayId, String slug, String title, List<Integer> stepNos, List<List<Long>> steps) {}

    public List<Chain> chainsOf(Long itemId) {
        List<Chain> chains = new ArrayList<>();
        jdbc.queryForList("SELECT DISTINCT p.id, p.slug, p.title FROM pathways p JOIN pathway_steps s ON s.pathway_id = p.id WHERE s.item_id = ? AND p.is_active = 1", itemId)
                .forEach(row -> {
                    Long pathwayId = ((Number) row.get("id")).longValue();
                    List<Map<String, Object>> groups = groupSteps(stepRows(pathwayId, true));
                    chains.add(new Chain(pathwayId, String.valueOf(row.get("slug")), String.valueOf(row.get("title")),
                            groups.stream().map(group -> ((Number) group.get("stepNo")).intValue()).toList(),
                            groups.stream().map(PathwayService::itemIdsOf).toList()));
                });
        return chains;
    }

    /** Indexes of `chain.steps()` the learner asked to go back to. */
    public Set<Integer> restartedOf(Long learnerId, Chain chain) {
        Set<Integer> numbers = new java.util.HashSet<>(jdbc.queryForList(
                "SELECT step_no FROM pathway_restarts WHERE learner_id = ? AND pathway_id = ?", Integer.class, learnerId, chain.pathwayId()));
        Set<Integer> indexes = new java.util.HashSet<>();
        for (int i = 0; i < chain.stepNos().size(); i++) if (numbers.contains(chain.stepNos().get(i))) indexes.add(i);
        return indexes;
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
