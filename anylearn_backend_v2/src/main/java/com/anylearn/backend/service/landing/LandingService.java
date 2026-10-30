package com.anylearn.backend.service.landing;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.PersonNames;
import com.anylearn.backend.service.ai.AiUsageService;
import com.anylearn.backend.service.ai.AnthropicClient;
import com.anylearn.backend.service.search.SearchFilters;
import com.anylearn.backend.service.seo.SeoRules;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Landing pages "{môn} cho trẻ {tuổi} tuổi tại {quận}" in TP HCM (plan 19.A7). `refresh` looks for every subject (tag) ×
 * age × district with at least 3 live courses counted like the search page, and keeps the demand of the subject (searches
 * of 90 days); an admin switches pages on and approves the introduction (written by hand or by AI). A page shows the
 * search results of its filters, the introduction, questions built from its own figures and links to related pages.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LandingService {

    /** (district, subject) pairs checked per age at most, the busiest first: keeps one refresh to a few hundred counts. */
    static final int MAX_PAIRS = 120;
    static final int PAGE_ITEMS = 24;

    private final JdbcTemplate jdbc;
    private final MeilisearchService meili;
    private final AnthropicClient ai;
    private final ObjectMapper mapper;
    private final PaymentConfig paymentConfig;

    @Value("${app.search.max-per-partner:2}")
    private int maxPerPartner;

    private SearchFilters filters(long tagId, Integer age, String districtCode) {
        var b = SearchFilters.Builder.empty().tags(List.of(tagId)).districtCode(districtCode).today(LocalDate.now());
        if (age != null) b.learnerAge(age, age);
        return b.build();
    }

    private record District(String code, String name) {}
    private record Tag(long id, String name) {}

    private List<District> districts() {
        return jdbc.query("SELECT code, name_with_type FROM districts WHERE parent_code = ? ORDER BY code", (rs, i) -> new District(rs.getString(1), rs.getString(2)), LandingRules.PROVINCE_CODE);
    }

    private Map<Long, Tag> activeTags() {
        Map<Long, Tag> out = new HashMap<>();
        jdbc.query("SELECT id, name FROM tags WHERE status = 1", rs -> { out.put(rs.getLong(1), new Tag(rs.getLong(1), rs.getString(2))); });
        return out;
    }

    /** Searches of 90 days whose words contain the subject's name. */
    private int demand(String tagName) {
        String needle = PersonNames.normalize(tagName);
        if (needle.length() < 2) return 0;
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM search_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) AND keyword_normalized LIKE ?", Integer.class,
                "%" + needle.replace("%", "").replace("_", "") + "%");
        return n == null ? 0 : n;
    }

    /**
     * Finds the combinations with enough courses and updates the course count of the known pages. New pages start
     * switched off. Returns {checked, created, updated, available} or {error} when Meilisearch cannot answer.
     */
    public Map<String, Object> refresh() {
        Map<Long, Tag> tags = activeTags();
        List<District> districts = districts();
        record Pair(District district, Tag tag, int count) {}
        List<Pair> pairs = new ArrayList<>();
        boolean answered = false;
        for (District d : districts) {
            Map<String, Integer> byTag = meili.facetCounts(SearchFilters.Builder.empty().districtCode(d.code()).today(LocalDate.now()).build(), "tagIds");
            if (!byTag.isEmpty()) answered = true;
            byTag.forEach((tagId, count) -> {
                Tag tag = tagId.matches("\\d+") ? tags.get(Long.parseLong(tagId)) : null;
                if (tag != null && LandingRules.enoughCourses(count)) pairs.add(new Pair(d, tag, count));
            });
        }
        Map<String, Object> out = new LinkedHashMap<>();
        if (!answered && !districts.isEmpty()) {
            out.put("error", "Không đọc được dữ liệu tìm kiếm (Meilisearch), thử lại sau");
            return out;
        }
        pairs.sort(Comparator.comparingInt(Pair::count).reversed());
        Map<Long, Integer> demandByTag = new HashMap<>();
        int checked = 0, created = 0, updated = 0;
        for (Pair p : pairs.subList(0, Math.min(MAX_PAIRS, pairs.size()))) {
            int demand = demandByTag.computeIfAbsent(p.tag().id(), id -> demand(p.tag().name()));
            for (int age = LandingRules.MIN_AGE; age <= LandingRules.MAX_AGE; age++) {
                long count = meili.countVisible(filters(p.tag().id(), age, p.district().code()), maxPerPartner);
                checked++;
                if (count < 0) continue;
                int changed = jdbc.update("UPDATE landing_pages SET course_count = ?, demand = ?, checked_at = NOW() WHERE tag_id = ? AND age = ? AND district_code = ?",
                        count, demand, p.tag().id(), age, p.district().code());
                if (changed > 0) { updated++; continue; }
                if (!LandingRules.enoughCourses(count)) continue;
                created += jdbc.update("INSERT IGNORE INTO landing_pages (path, tag_id, age, province_code, district_code, course_count, demand, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                        LandingRules.path(p.tag().name(), age, p.district().name()), p.tag().id(), age, LandingRules.PROVINCE_CODE, p.district().code(), count, demand);
            }
        }
        // pages whose subject or district lost every course were not visited above
        jdbc.update("UPDATE landing_pages SET course_count = 0, checked_at = NOW() WHERE checked_at IS NULL OR checked_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        out.put("checked", checked);
        out.put("created", created);
        out.put("updated", updated);
        out.put("available", jdbc.queryForObject("SELECT COUNT(*) FROM landing_pages WHERE course_count >= " + SeoRules.LANDING_MIN_COURSES, Long.class));
        return out;
    }

    /** Every night after the search reindex (5:00) and the explore reindex (5:20). */
    @Scheduled(cron = "0 40 5 * * *")
    public void nightly() {
        try {
            Map<String, Object> result = refresh();
            log.info("[landing] refresh {}", result);
        } catch (Exception e) {
            log.warn("[landing] refresh failed: {}", e.getMessage());
        }
    }

    private static final String COLUMNS = "l.id, l.path, l.tag_id AS tagId, t.name AS tagName, l.age, l.district_code AS districtCode, d.name_with_type AS districtName, " +
            "l.intro, l.intro_status AS introStatus, l.enabled, l.course_count AS courseCount, l.demand, l.checked_at AS checkedAt, l.updated_at AS updatedAt";
    private static final String FROM = " FROM landing_pages l JOIN tags t ON t.id = l.tag_id LEFT JOIN districts d ON d.code = l.district_code ";

    private static Map<String, Object> withTitle(Map<String, Object> row) {
        row.put("title", LandingRules.title((String) row.get("tagName"), ((Number) row.get("age")).intValue(), String.valueOf(row.get("districtName"))));
        if (row.get("enabled") instanceof Number n) row.put("enabled", n.intValue() == 1);
        return row;
    }

    /** For the back office: busiest subjects first. */
    public List<Map<String, Object>> list(String filter) {
        String where = switch (filter == null ? "" : filter) {
            case "on" -> "WHERE l.enabled = 1 ";
            case "off" -> "WHERE l.enabled = 0 AND l.course_count >= " + SeoRules.LANDING_MIN_COURSES + " ";
            case "draft" -> "WHERE l.intro_status = 'draft' ";
            case "few" -> "WHERE l.course_count < " + SeoRules.LANDING_MIN_COURSES + " ";
            default -> "";
        };
        String site = paymentConfig.getFrontendUrl() == null ? "" : paymentConfig.getFrontendUrl().replaceAll("/+$", "");
        return jdbc.queryForList("SELECT " + COLUMNS + FROM + where + "ORDER BY l.demand DESC, l.course_count DESC, l.id LIMIT 1000").stream().map(r -> {
            Map<String, Object> row = withTitle(r);
            row.put("url", site + "/hoc/" + row.get("path"));
            return row;
        }).toList();
    }

    public void setEnabled(long id, boolean enabled) {
        if (jdbc.update("UPDATE landing_pages SET enabled = ? WHERE id = ?", enabled ? 1 : 0, id) == 0) throw new IllegalArgumentException("Không tìm thấy trang");
    }

    /** Switches on every page that has enough courses; returns how many. */
    public int enableAllReady() {
        return jdbc.update("UPDATE landing_pages SET enabled = 1 WHERE enabled = 0 AND course_count >= " + SeoRules.LANDING_MIN_COURSES);
    }

    public void saveIntro(long id, String intro, String status) {
        String text = LandingRules.cleanIntro(intro);
        String clean = text == null ? "none" : LandingRules.cleanIntroStatus(status);
        if (jdbc.update("UPDATE landing_pages SET intro = ?, intro_status = ? WHERE id = ?", text, clean, id) == 0) throw new IllegalArgumentException("Không tìm thấy trang");
    }

    private Map<String, Object> row(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + COLUMNS + FROM + "WHERE l.id = ?", id);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy trang");
        return withTitle(rows.get(0));
    }

    private static final Map<String, Object> INTRO_TOOL = Map.of(
            "name", "write_intro",
            "description", "Ghi đoạn giới thiệu của trang.",
            "input_schema", Map.of("type", "object",
                    "properties", Map.of("intro", Map.of("type", "string", "description", "đoạn giới thiệu tiếng Việt, 70 đến 120 từ")),
                    "required", List.of("intro")));

    private static final String INTRO_SYSTEM = "Bạn viết đoạn giới thiệu ngắn cho một trang web của anyLEARN (sàn khóa học cho trẻ em) "
            + "liệt kê các khóa học theo môn, độ tuổi và quận ở TP.HCM. Viết cho phụ huynh, giọng gần gũi, tiếng Việt có dấu, 70 đến 120 từ, một đoạn. "
            + "Chỉ dùng thông tin trong dữ liệu được đưa (số khóa, khoảng học phí, tên vài khóa và trường); không bịa con số, không nói khóa nào tốt nhất, "
            + "không hứa điều gì ngoài: giá bằng hoặc rẻ hơn tại trường, đăng ký mà lớp không mở thì được hoàn tiền. Viết đúng chữ anyPoint nếu nhắc tới. "
            + "Có thể nêu lợi ích của môn học với trẻ ở độ tuổi đó một cách chung, không khẳng định y khoa.";

    /** Asks the AI for an introduction from the page's own figures; saved as a draft for an admin to read and approve. */
    public Map<String, Object> writeIntro(long id) {
        if (!ai.isConfigured()) throw new IllegalArgumentException("Máy chủ chưa có khóa ANTHROPIC_API_KEY");
        Map<String, Object> page = row(id);
        long tagId = ((Number) page.get("tagId")).longValue();
        int age = ((Number) page.get("age")).intValue();
        Map<String, Object> result = meili.search("", 0, 8, "popular", filters(tagId, age, (String) page.get("districtCode")), maxPerPartner);
        @SuppressWarnings("unchecked") List<Map<String, Object>> items = (List<Map<String, Object>>) result.getOrDefault("items", List.of());
        StringBuilder data = new StringBuilder();
        data.append("Môn: ").append(page.get("tagName")).append("\nĐộ tuổi: ").append(age).append(" tuổi\nKhu vực: ").append(page.get("districtName")).append(", TP.HCM\n");
        data.append("Số khóa đang mở: ").append(result.getOrDefault("total", items.size())).append('\n');
        long min = Long.MAX_VALUE, max = 0;
        for (Map<String, Object> it : items) {
            long price = it.get("price") instanceof Number n ? n.longValue() : 0;
            if (price > 0) { min = Math.min(min, price); max = Math.max(max, price); }
            data.append("- ").append(it.get("title")).append(it.get("authorName") != null ? " (" + it.get("authorName") + ")" : "").append('\n');
        }
        if (max > 0) data.append("Học phí các khóa trên: từ ").append(LandingRules.price(min)).append(" đến ").append(LandingRules.price(max)).append('\n');
        AnthropicClient.Answer answer = ai.askTool(AiUsageService.LANDING_INTRO, INTRO_SYSTEM, "<du_lieu>\n" + data + "</du_lieu>", 600, INTRO_TOOL);
        String intro;
        try {
            JsonNode node = mapper.readTree(answer.text());
            intro = node.path("intro").asText("").trim();
        } catch (Exception e) {
            intro = "";
        }
        if (intro.isEmpty()) throw new IllegalArgumentException("AI không trả lời được, thử lại sau");
        if (intro.length() > LandingRules.MAX_INTRO) intro = intro.substring(0, LandingRules.MAX_INTRO);
        jdbc.update("UPDATE landing_pages SET intro = ?, intro_status = 'draft' WHERE id = ?", intro, id);
        return row(id);
    }

    // ---- visitors ----

    /**
     * The public page of `/hoc/{path}`: null when unknown, switched off or under 3 live courses (the site answers 404).
     */
    public Map<String, Object> publicPage(String rawPath) {
        LandingRules.Parts parts = LandingRules.parse(rawPath);
        if (parts == null) return null;
        String path = parts.tagSlug() + "/" + parts.age() + "-tuoi/" + parts.districtSlug();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + COLUMNS + FROM + "WHERE l.path = ? AND l.enabled = 1", path);
        if (rows.isEmpty()) return null;
        Map<String, Object> page = withTitle(rows.get(0));
        long tagId = ((Number) page.get("tagId")).longValue();
        int age = parts.age();
        String tagName = (String) page.get("tagName");
        String districtName = String.valueOf(page.get("districtName"));
        Map<String, Object> result = meili.search("", 0, PAGE_ITEMS, "popular", filters(tagId, age, (String) page.get("districtCode")), maxPerPartner);
        long total = result.get("total") instanceof Number n ? n.longValue() : 0;
        if (!LandingRules.enoughCourses(total)) return null;
        @SuppressWarnings("unchecked") List<Map<String, Object>> items = (List<Map<String, Object>>) result.getOrDefault("items", List.of());
        Long min = null, max = null;
        long freeTrial = 0;
        for (Map<String, Object> it : items) {
            if (it.get("price") instanceof Number n && n.longValue() > 0) {
                min = min == null ? n.longValue() : Math.min(min, n.longValue());
                max = max == null ? n.longValue() : Math.max(max, n.longValue());
            }
            if (Boolean.TRUE.equals(it.get("hasFreeTrial"))) freeTrial++;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("path", path);
        out.put("title", page.get("title"));
        out.put("description", LandingRules.metaDescription(tagName, age, districtName, total));
        out.put("intro", "approved".equals(page.get("introStatus")) && page.get("intro") != null ? page.get("intro") : LandingRules.defaultIntro(tagName, age, districtName, total));
        out.put("tagId", tagId);
        out.put("tagName", tagName);
        out.put("age", age);
        out.put("districtCode", page.get("districtCode"));
        out.put("districtName", districtName);
        out.put("provinceCode", LandingRules.PROVINCE_CODE);
        out.put("provinceName", LandingRules.PROVINCE_NAME);
        out.put("total", total);
        out.put("items", items);
        out.put("faq", LandingRules.faq(tagName, age, districtName, total, min, max, freeTrial));
        out.put("updatedAt", page.get("updatedAt"));
        out.put("related", related(((Number) page.get("id")).longValue(), tagId, age, (String) page.get("districtCode")));
        return out;
    }

    /** Other switched-on pages: the same subject nearby in age or place, then other subjects in the same district and age. */
    private List<Map<String, Object>> related(long id, long tagId, int age, String districtCode) {
        String min = " AND l.course_count >= " + SeoRules.LANDING_MIN_COURSES;
        List<Map<String, Object>> rows = new ArrayList<>(jdbc.queryForList("SELECT " + COLUMNS + FROM + "WHERE l.enabled = 1" + min + " AND l.id <> ? AND l.tag_id = ? " +
                "ORDER BY (l.district_code = ?) DESC, ABS(l.age - ?), l.demand DESC LIMIT 8", id, tagId, districtCode, age));
        rows.addAll(jdbc.queryForList("SELECT " + COLUMNS + FROM + "WHERE l.enabled = 1" + min + " AND l.tag_id <> ? AND l.district_code = ? AND l.age = ? ORDER BY l.demand DESC LIMIT 8",
                tagId, districtCode, age));
        return rows.stream().map(LandingService::withTitle).map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("path", r.get("path"));
            m.put("title", r.get("title"));
            m.put("courseCount", r.get("courseCount"));
            return m;
        }).toList();
    }
}
