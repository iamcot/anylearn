package com.anylearn.backend.service;

import com.anylearn.backend.dto.ItemSearchDocument;
import com.anylearn.backend.dto.UserSearchDocument;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.repository.ItemCategoryRepository;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.TagRepository;
import com.anylearn.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.SearchRequest;
import com.meilisearch.sdk.exceptions.MeilisearchException;
import com.meilisearch.sdk.model.SearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeilisearchService {

    private final Client meilisearchClient;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final TagRepository tagRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final com.anylearn.backend.repository.UserLocationRepository userLocationRepository;
    private final ObjectMapper objectMapper;

    @Lazy
    @Autowired
    private ConfigService configService;

    @Async
    public void indexItem(Long itemId) {
        itemRepository.findById(itemId).ifPresent(item -> {
            try {
                var doc = buildDocument(item);
                String json = objectMapper.writeValueAsString(List.of(doc));
                meilisearchClient.index("items").addDocuments(json, "id");
                log.debug("Indexed item {}", itemId);
            } catch (Exception e) {
                log.warn("Failed to index item {}: {}", itemId, e.getMessage());
            }
        });
    }

    @Async
    public void deleteItem(Long itemId) {
        try {
            meilisearchClient.index("items").deleteDocument(String.valueOf(itemId));
        } catch (MeilisearchException e) {
            log.warn("Failed to delete item {} from index: {}", itemId, e.getMessage());
        }
    }

    public Map<String, Object> search(String query, int page, int pageSize, String category, String sort, Long authorId, String age, String priceRange, String location, String mode) {
        try {
            List<String> filters = new java.util.ArrayList<>(List.of("status = 1", "userStatus = 1"));
            if (category != null && !category.isBlank()) filters.add("categoryUrls = \"" + category + "\"");
            if (authorId != null) filters.add("authorId = " + authorId);

            // Age filter
            if (age != null) switch (age) {
                case "3-5"  -> { filters.add("agesMin <= 5");  filters.add("agesMax >= 3"); }
                case "6-10" -> { filters.add("agesMin <= 10"); filters.add("agesMax >= 6"); }
                case "11-15"-> { filters.add("agesMin <= 15"); filters.add("agesMax >= 11"); }
                case "16+"  -> filters.add("agesMax >= 16");
            }

            // Price filter
            if (priceRange != null) switch (priceRange) {
                case "under2" -> filters.add("price < 2000000");
                case "2to5"   -> { filters.add("price >= 2000000"); filters.add("price <= 5000000"); }
                case "over5"  -> filters.add("price > 5000000");
            }

            // Location filter (province code)
            if (location != null && !location.isBlank()) {
                filters.add("authorProvinceCodes = \"" + location + "\"");
            }

            // Mode/format filter
            if (mode != null) switch (mode) {
                case "online"  -> filters.add("subtype = \"online\"");
                case "digital" -> filters.add("subtype = \"digital\"");
                case "offline" -> { filters.add("subtype != \"online\""); filters.add("subtype != \"digital\""); }
            }

            String[] sortClause = switch (sort != null ? sort : "popular") {
                case "newest"    -> new String[]{"id:desc"};
                case "priceLow"  -> new String[]{"price:asc"};
                case "priceHigh" -> new String[]{"price:desc"};
                default          -> new String[]{"isHot:desc", "boostScore:desc"};
            };

            var request = SearchRequest.builder()
                    .q(query != null ? query : "")
                    .filter(filters.toArray(new String[0]))
                    .sort(sortClause)
                    .offset(page * pageSize)
                    .limit(pageSize)
                    .build();

            var rawResult = meilisearchClient.index("items").search(request);
            SearchResult result = (SearchResult) rawResult;
            List<Map<String, Object>> hits = objectMapper.convertValue(
                    result.getHits(), new TypeReference<>() {});

            List<Long> ids = hits.stream()
                    .map(h -> ((Number) h.get("id")).longValue())
                    .collect(Collectors.toList());

            // Build categoryTitles lookup from Meilisearch hits
            Map<Long, String> categoryTitlesMap = hits.stream()
                    .filter(h -> h.get("categoryTitles") != null)
                    .collect(Collectors.toMap(
                            h -> ((Number) h.get("id")).longValue(),
                            h -> h.get("categoryTitles").toString(),
                            (a, b) -> a
                    ));

            List<Map<String, Object>> items = ids.isEmpty()
                    ? Collections.emptyList()
                    : configService.getItemsByIds(ids).stream()
                        .map(item -> {
                            Map<String, Object> m = new java.util.LinkedHashMap<>(
                                    objectMapper.convertValue(item, new TypeReference<Map<String, Object>>() {}));
                            Long itemId = ((Number) m.get("id")).longValue();
                            if (categoryTitlesMap.containsKey(itemId)) {
                                m.put("categoryTitles", categoryTitlesMap.get(itemId));
                            }
                            return m;
                        })
                        .collect(Collectors.toList());

            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("items", items);
            response.put("total", result.getEstimatedTotalHits());
            response.put("page", page);
            response.put("pageSize", pageSize);
            return response;
        } catch (Exception e) {
            log.warn("Meilisearch search failed: {}", e.getMessage());
            Map<String, Object> empty = new java.util.LinkedHashMap<>();
            empty.put("items", Collections.emptyList());
            empty.put("total", 0);
            empty.put("page", page);
            empty.put("pageSize", pageSize);
            return empty;
        }
    }

    public List<Long> findSimilarIds(Long itemId, Long authorId, String title, List<String> categoryUrls, String subtype, int limit) {
        try {
            List<String> filters = new java.util.ArrayList<>(List.of("status = 1", "userStatus = 1"));
            if (authorId != null) filters.add("authorId != " + authorId);
            List<String> orParts = new java.util.ArrayList<>();
            if (categoryUrls != null) {
                for (String url : categoryUrls) orParts.add("categoryUrls = \"" + url + "\"");
            }
            if (subtype != null && !subtype.isBlank()) orParts.add("subtype = \"" + subtype + "\"");
            if (!orParts.isEmpty()) filters.add(String.join(" OR ", orParts));

            var request = SearchRequest.builder()
                    .q(title != null ? title : "")
                    .filter(filters.toArray(new String[0]))
                    .sort(new String[]{"isHot:desc", "boostScore:desc"})
                    .limit(limit + 1)
                    .build();

            var rawResult = meilisearchClient.index("items").search(request);
            SearchResult result = (SearchResult) rawResult;
            List<Map<String, Object>> hits = objectMapper.convertValue(result.getHits(), new TypeReference<>() {});
            return hits.stream()
                    .map(h -> ((Number) h.get("id")).longValue())
                    .filter(id -> !id.equals(itemId))
                    .limit(limit)
                    .toList();
        } catch (Exception e) {
            log.warn("findSimilarIds failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public void reindexAll() {
        int page = 0;
        int batchSize = 100;
        int indexed = 0;

        log.info("Starting full reindex...");
        while (true) {
            var items = itemRepository.findAll(PageRequest.of(page, batchSize));
            if (items.isEmpty()) break;

            try {
                var docs = items.stream().map(this::buildDocument).toList();
                String json = objectMapper.writeValueAsString(docs);
                meilisearchClient.index("items").addDocuments(json, "id");
                indexed += docs.size();
                log.info("Reindexed {} items so far...", indexed);
            } catch (Exception e) {
                log.error("Reindex batch {} failed: {}", page, e.getMessage());
            }
            page++;
        }
        log.info("Reindex complete. Total: {}", indexed);
    }

    private ItemSearchDocument buildDocument(Item item) {
        var author = userRepository.findById(item.getUserId()).orElse(null);
        String authorName  = author != null ? author.getName()  : "";
        String authorImage = author != null ? author.getImage() : null;
        List<String> authorProvinceCodes = author != null
                ? userLocationRepository.findProvinceCodesByUserId(author.getId())
                : java.util.Collections.emptyList();

        List<Map<String, Object>> cats = itemCategoryRepository.findCategoriesByItemId(item.getId());
        String categoryTitles = cats.stream()
                .map(c -> String.valueOf(c.get("title")))
                .collect(Collectors.joining("|"));

        List<String> categoryUrls = itemCategoryRepository.findAllCategoryUrlsByItemId(item.getId());
        String tags = tagRepository.findTagsByItemId(item.getId());

        return new ItemSearchDocument(
                item.getId(),
                item.getTitle(),
                item.getType(),
                item.getSubtype(),
                item.getShortContent(),
                item.getContent(),
                tags,
                authorName,
                authorImage,
                item.getUserId(),
                authorProvinceCodes,
                categoryTitles,
                categoryUrls,
                item.getPrice(),
                item.getAgesMin() != null ? item.getAgesMin().intValue() : null,
                item.getAgesMax() != null ? item.getAgesMax().intValue() : null,
                item.getStatus() != null ? item.getStatus() : 0,
                item.getUserStatus() != null ? item.getUserStatus() : 0,
                item.getIsHot() != null ? item.getIsHot() : 0,
                item.getBoostScore() != null ? item.getBoostScore() : 0,
                item.getImage(),
                item.getDateStart() != null ? item.getDateStart().toString() : null
        );
    }

    // ── User indexing ──

    @Async
    public void indexUser(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (!List.of("school", "teacher").contains(user.getRole())) return;
            try {
                var doc = buildUserDocument(user);
                String json = objectMapper.writeValueAsString(List.of(doc));
                meilisearchClient.index("users").addDocuments(json, "id");
                log.debug("Indexed user {}", userId);
            } catch (Exception e) {
                log.warn("Failed to index user {}: {}", userId, e.getMessage());
            }
        });
    }

    @Async
    public void deleteUser(Long userId) {
        try {
            meilisearchClient.index("users").deleteDocument(String.valueOf(userId));
        } catch (MeilisearchException e) {
            log.warn("Failed to delete user {} from index: {}", userId, e.getMessage());
        }
    }

    public Map<String, Object> searchUsers(String query, String role, int page, int pageSize, String sort, Long authorId) {
        try {
            List<String> filters = new java.util.ArrayList<>(List.of("status = 1", "isTest = 0"));
            if (role != null && !role.isBlank()) filters.add("role = \"" + role + "\"");
            if (authorId != null) filters.add("id = " + authorId);

            String[] sortClause = switch (sort != null ? sort : "popular") {
                case "newest" -> new String[]{"id:desc"};
                default       -> new String[]{"isHot:desc", "boostScore:desc"};
            };

            var request = SearchRequest.builder()
                    .q(query != null ? query : "")
                    .filter(filters.toArray(new String[0]))
                    .sort(sortClause)
                    .offset(page * pageSize)
                    .limit(pageSize)
                    .build();

            var rawResult = meilisearchClient.index("users").search(request);
            SearchResult result = (SearchResult) rawResult;
            List<Map<String, Object>> hits = objectMapper.convertValue(result.getHits(), new TypeReference<>() {});

            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("items", hits);
            response.put("total", result.getEstimatedTotalHits());
            response.put("page", page);
            response.put("pageSize", pageSize);
            return response;
        } catch (Exception e) {
            log.warn("Meilisearch user search failed: {}", e.getMessage());
            Map<String, Object> empty = new java.util.LinkedHashMap<>();
            empty.put("items", Collections.emptyList());
            empty.put("total", 0);
            empty.put("page", page);
            empty.put("pageSize", pageSize);
            return empty;
        }
    }

    public void reindexAllUsers() {
        int page = 0, batchSize = 100, indexed = 0;
        log.info("Starting full user reindex...");
        while (true) {
            var users = userRepository.findAll(org.springframework.data.domain.PageRequest.of(page, batchSize));
            if (users.isEmpty()) break;
            try {
                var docs = users.stream()
                        .filter(u -> List.of("school", "teacher").contains(u.getRole()) && u.getStatus() == 1)
                        .map(this::buildUserDocument)
                        .toList();
                if (!docs.isEmpty()) {
                    String json = objectMapper.writeValueAsString(docs);
                    meilisearchClient.index("users").addDocuments(json, "id");
                    indexed += docs.size();
                }
            } catch (Exception e) {
                log.error("User reindex batch {} failed: {}", page, e.getMessage());
            }
            page++;
        }
        log.info("User reindex complete. Total: {}", indexed);
    }

    private UserSearchDocument buildUserDocument(com.anylearn.backend.entity.User user) {
        Double rating = itemUserActionRepository.avgRatingByOwner(user.getId());
        return new UserSearchDocument(
                user.getId(),
                user.getName(),
                user.getRole(),
                user.getTitle(),
                user.getIntroduce(),
                user.getImage(),
                user.getBanner(),
                user.getIsHot() != null ? user.getIsHot() : 0,
                user.getBoostScore() != null ? user.getBoostScore() : 0,
                user.getStatus() != null ? user.getStatus() : 0,
                user.getIsTest() != null ? user.getIsTest() : 0,
                rating
        );
    }
}
