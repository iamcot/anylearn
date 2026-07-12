package com.anylearn.backend.service;

import com.anylearn.backend.dto.ItemSearchDocument;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.repository.ItemCategoryRepository;
import com.anylearn.backend.repository.ItemRepository;
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
    @Lazy
    private final ConfigService configService;
    private final ObjectMapper objectMapper;

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

    public Map<String, Object> search(String query, int page, int pageSize, String category, String sort) {
        try {
            List<String> filters = new java.util.ArrayList<>(List.of("status = 1", "userStatus = 1"));
            if (category != null && !category.isBlank()) {
                filters.add("categoryUrls = \"" + category + "\"");
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

            List<?> items = ids.isEmpty() ? Collections.emptyList() : configService.getItemsByIds(ids);

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
        String authorName = userRepository.findById(item.getUserId())
                .map(u -> u.getName()).orElse("");

        List<Map<String, Object>> cats = itemCategoryRepository.findCategoriesByItemId(item.getId());
        String categoryTitles = cats.stream()
                .map(c -> String.valueOf(c.get("title")))
                .collect(Collectors.joining(" "));

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
                categoryTitles,
                categoryUrls,
                item.getPrice(),
                item.getStatus() != null ? item.getStatus() : 0,
                item.getUserStatus() != null ? item.getUserStatus() : 0,
                item.getIsHot() != null ? item.getIsHot() : 0,
                item.getBoostScore() != null ? item.getBoostScore() : 0,
                item.getImage(),
                item.getDateStart() != null ? item.getDateStart().toString() : null
        );
    }
}
