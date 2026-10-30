package com.anylearn.backend.service.seo;

import com.anylearn.backend.service.collections.CollectionService;
import com.anylearn.backend.service.search.ItemVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The public links the site's sitemap lists (plan 19.A1): courses visitors may see (ItemVisibility), live partners,
 * articles, collections in season, active pathways, published Khám phá posts and landing pages. Each row is
 * `{type, id, slug, updatedAt}`; the site builds the address. Answers are kept one hour.
 */
@Service
@RequiredArgsConstructor
public class SitemapService {

    static final long CACHE_MS = 3_600_000L;

    private final JdbcTemplate jdbc;
    private final CollectionService collections;

    private record Cached(long at, Object value) {}
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    private <T> T cached(String key, java.util.function.Supplier<T> load) {
        Cached hit = cache.get(key);
        long now = System.currentTimeMillis();
        if (hit != null && now - hit.at() < CACHE_MS) return (T) hit.value();
        T value = load.get();
        cache.put(key, new Cached(now, value));
        return value;
    }

    private static final String PARTNER_SQL = " FROM users a WHERE a.role IN ('school', 'teacher') AND " + ItemVisibility.AUTHOR_LIVE_SQL;

    /** How many links of each type, and how many files they take. */
    public Map<String, Object> summary() {
        return cached("summary", () -> {
            List<Map<String, Object>> types = new ArrayList<>();
            for (String type : SeoRules.TYPES) {
                long count = count(type);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("type", type);
                row.put("count", count);
                row.put("pages", SeoRules.pages(count));
                types.add(row);
            }
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("pageSize", SeoRules.PAGE_SIZE);
            out.put("types", types);
            return out;
        });
    }

    /** One file of links of a type (1-based page). */
    public List<Map<String, Object>> page(String type, int page) {
        if (!SeoRules.knownType(type)) return List.of();
        return cached(type + ":" + page, () -> load(type, page));
    }

    private long count(String type) {
        return switch (type) {
            case "course" -> one("SELECT COUNT(*) FROM items i WHERE " + ItemVisibility.VISIBLE_ITEM_SQL);
            case "partner" -> one("SELECT COUNT(*)" + PARTNER_SQL);
            case "article" -> one("SELECT COUNT(*) FROM articles WHERE status = 1");
            case "collection" -> collections.listPublic(LocalDate.now()).size();
            case "pathway" -> one("SELECT COUNT(*) FROM pathways WHERE is_active = 1");
            case "explore" -> one("SELECT COUNT(*) FROM explore_posts WHERE status = 'published'");
            case "landing" -> one("SELECT COUNT(*) FROM landing_pages WHERE enabled = 1 AND course_count >= " + SeoRules.LANDING_MIN_COURSES);
            default -> 0;
        };
    }

    private long one(String sql) {
        Long v = jdbc.queryForObject(sql, Long.class);
        return v == null ? 0 : v;
    }

    private List<Map<String, Object>> load(String type, int page) {
        int offset = SeoRules.offset(page);
        String limit = " LIMIT " + SeoRules.PAGE_SIZE + " OFFSET " + offset;
        List<Map<String, Object>> out = new ArrayList<>();
        switch (type) {
            case "course" -> jdbc.query("SELECT i.id, i.title, i.seo_url, COALESCE(i.updated_at, i.created_at) AS at FROM items i WHERE " + ItemVisibility.VISIBLE_ITEM_SQL + " ORDER BY i.id" + limit,
                    rs -> { String seo = rs.getString(3); out.add(row(type, rs.getLong(1), seo != null && !seo.isBlank() ? seo.trim() : SeoRules.slug(rs.getString(2)), rs.getTimestamp(4))); });
            case "partner" -> jdbc.query("SELECT a.id, a.name, COALESCE(a.updated_at, a.created_at)" + PARTNER_SQL + " ORDER BY a.id" + limit,
                    rs -> { out.add(row(type, rs.getLong(1), SeoRules.slug(rs.getString(2)), rs.getTimestamp(3))); });
            case "article" -> jdbc.query("SELECT id, title, COALESCE(updated_at, created_at) FROM articles WHERE status = 1 ORDER BY id" + limit,
                    rs -> { out.add(row(type, rs.getLong(1), SeoRules.slug(rs.getString(2)), rs.getTimestamp(3))); });
            case "collection" -> {
                List<Map<String, Object>> list = collections.listPublic(LocalDate.now());
                for (Map<String, Object> c : list.subList(Math.min(offset, list.size()), Math.min(offset + SeoRules.PAGE_SIZE, list.size()))) {
                    out.add(row(type, ((Number) c.get("id")).longValue(), (String) c.get("slug"), null));
                }
            }
            case "pathway" -> jdbc.query("SELECT id, slug, COALESCE(updated_at, created_at) FROM pathways WHERE is_active = 1 ORDER BY id" + limit,
                    rs -> { out.add(row(type, rs.getLong(1), rs.getString(2), rs.getTimestamp(3))); });
            // the counters change on every view, so the date is the publication
            case "explore" -> jdbc.query("SELECT id, title, published_at FROM explore_posts WHERE status = 'published' ORDER BY id" + limit,
                    rs -> { out.add(row(type, rs.getLong(1), SeoRules.slug(rs.getString(2)), rs.getTimestamp(3))); });
            case "landing" -> jdbc.query("SELECT id, path, COALESCE(updated_at, created_at) FROM landing_pages WHERE enabled = 1 AND course_count >= " + SeoRules.LANDING_MIN_COURSES + " ORDER BY id" + limit,
                    rs -> { out.add(row(type, rs.getLong(1), rs.getString(2), rs.getTimestamp(3))); });
            default -> { }
        }
        return out;
    }

    private static Map<String, Object> row(String type, long id, String slug, java.sql.Timestamp at) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type);
        m.put("id", id);
        m.put("slug", slug);
        m.put("updatedAt", at == null ? null : at.toLocalDateTime().toLocalDate().toString());
        return m;
    }

    /** Forget the kept answers (after a reindex). */
    public void clear() {
        cache.clear();
    }
}
