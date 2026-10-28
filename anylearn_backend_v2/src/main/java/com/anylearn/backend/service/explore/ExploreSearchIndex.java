package com.anylearn.backend.service.explore;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.SearchRequest;
import com.meilisearch.sdk.model.SearchResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Meilisearch index `explore_posts` (plan 16): published posts only, searchable by title, description and tag names.
 * Written after every save or status change, rebuilt at 5:20 and by `POST /admin/reindex`. Search answers null when
 * Meilisearch fails so the caller can fall back to SQL.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExploreSearchIndex {

    static final String INDEX = "explore_posts";

    private final Client meili;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    @PostConstruct
    public void setup() {
        try {
            meili.createIndex(INDEX, "id");
            var index = meili.index(INDEX);
            index.updateSearchableAttributesSettings(new String[]{"title", "tagNames", "body"});
            index.updateFilterableAttributesSettings(new String[]{"kind", "authorId", "tagIds"});
            index.updateSortableAttributesSettings(new String[]{"publishedAt", "likes"});
        } catch (Exception e) {
            log.warn("Meilisearch index {} not configured: {}", INDEX, e.getMessage());
        }
    }

    private List<Map<String, Object>> documents(String where, Object... args) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT p.id, p.kind, p.title, p.body, p.author_id AS authorId, p.published_at AS publishedAt, p.likes, " +
                "(SELECT GROUP_CONCAT(t.name SEPARATOR '|') FROM explore_post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id) AS tagNames, " +
                "(SELECT GROUP_CONCAT(pt.tag_id) FROM explore_post_tags pt WHERE pt.post_id = p.id) AS tagIds " +
                "FROM explore_posts p WHERE p.status = 'published' " + where, args);
        List<Map<String, Object>> docs = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("id", ((Number) r.get("id")).longValue());
            d.put("kind", r.get("kind"));
            d.put("title", r.get("title"));
            String body = (String) r.get("body");
            d.put("body", body == null ? "" : body.length() > 2000 ? body.substring(0, 2000) : body);
            d.put("authorId", r.get("authorId"));
            d.put("publishedAt", r.get("publishedAt") instanceof Timestamp t ? t.getTime() / 1000 : r.get("publishedAt") instanceof java.time.LocalDateTime l ? l.atZone(java.time.ZoneId.systemDefault()).toEpochSecond() : 0);
            d.put("likes", r.get("likes"));
            String names = (String) r.get("tagNames");
            d.put("tagNames", names == null ? List.of() : List.of(names.split("\\|")));
            String ids = (String) r.get("tagIds");
            d.put("tagIds", ids == null ? List.of() : java.util.Arrays.stream(ids.split(",")).map(Long::parseLong).toList());
            docs.add(d);
        }
        return docs;
    }

    /** Adds or refreshes one post; a post that is not published is removed. */
    @Async
    public void indexPost(long postId) {
        try {
            List<Map<String, Object>> docs = documents("AND p.id = ?", postId);
            if (docs.isEmpty()) meili.index(INDEX).deleteDocument(String.valueOf(postId));
            else meili.index(INDEX).addDocuments(mapper.writeValueAsString(docs), "id");
        } catch (Exception e) {
            log.warn("Explore post {} not indexed: {}", postId, e.getMessage());
        }
    }

    @Async
    public void reindexAllAsync() {
        reindexAll();
    }

    @Scheduled(cron = "0 20 5 * * *")
    public void reindexAll() {
        try {
            meili.index(INDEX).deleteAllDocuments();
            List<Map<String, Object>> docs = documents("ORDER BY p.id");
            for (int from = 0; from < docs.size(); from += 500) {
                meili.index(INDEX).addDocuments(mapper.writeValueAsString(docs.subList(from, Math.min(from + 500, docs.size()))), "id");
            }
            log.info("Explore reindex: {} posts", docs.size());
        } catch (Exception e) {
            log.warn("Explore reindex failed: {}", e.getMessage());
        }
    }

    /** Ids of matching posts in relevance order, the slice offset..offset+limit, plus the estimated total; null when Meilisearch failed. */
    public Hits search(String q, int offset, int limit) {
        try {
            var request = SearchRequest.builder().q(q).attributesToRetrieve(new String[]{"id"}).offset(offset).limit(limit).build();
            SearchResult result = (SearchResult) meili.index(INDEX).search(request);
            List<Long> ids = result.getHits().stream().map(h -> ((Number) h.get("id")).longValue()).toList();
            return new Hits(ids, result.getEstimatedTotalHits());
        } catch (Exception e) {
            log.warn("Explore search failed, using SQL: {}", e.getMessage());
            return null;
        }
    }

    public record Hits(List<Long> ids, long total) {}
}
