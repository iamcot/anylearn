package com.anylearn.backend.service;

import com.anylearn.backend.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConfigService {

    private final ConfigurationRepository configurationRepository;
    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final TagRepository tagRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> homeV2(String role) {
        Map<String, Object> result = new LinkedHashMap<>();

        // Banners
        result.put("new_banners", getBanners());

        // Articles (read + video)
        var articles = articleRepository.findByStatusAndTypeInOrderByIdDesc(
                (byte) 1, List.of("read", "video"), PageRequest.of(0, 5));
        result.put("articles", articles);

        // Home popup config
        result.put("configs", getHomeConfig());

        // Home special classes blocks
        result.put("home_classes", getHomeSpecialClasses());

        // Promotions
        result.put("promotions", articleRepository.findByStatusAndTypeOrderByIdDesc(
                (byte) 1, "promotion", PageRequest.of(0, 5)));
        result.put("promotions_title", "Ưu đãi độc quyền");

        // Events
        result.put("events", articleRepository.findByStatusAndTypeOrderByIdDesc(
                (byte) 1, "event", PageRequest.of(0, 5)));
        result.put("events_title", "Sự kiện nổi bật");

        // Categories with items
        result.put("categories", getCategoriesWithItems());

        return result;
    }

    private List<Object> getBanners() {
        return configurationRepository.findByKey("home_app_banners").map(c -> {
            try {
                return objectMapper.readValue(c.getValue(), new TypeReference<List<Object>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse banners: {}", e.getMessage());
                return new ArrayList<>();
            }
        }).orElse(new ArrayList<>());
    }

    private Map<String, Object> getHomeConfig() {
        Map<String, Object> config = new LinkedHashMap<>();
        configurationRepository.findByKey("home_popup").ifPresent(c -> {
            try {
                Map<String, Object> popup = objectMapper.readValue(c.getValue(), new TypeReference<>() {});
                if (Integer.valueOf(1).equals(popup.get("status"))) {
                    config.put("popup", popup);
                }
            } catch (Exception e) {
                log.warn("Failed to parse home_popup: {}", e.getMessage());
            }
        });
        return config;
    }

    private List<Map<String, Object>> getHomeSpecialClasses() {
        return configurationRepository.findByKey("home_special_classes").map(c -> {
            try {
                List<Map<String, Object>> blocks = objectMapper.readValue(c.getValue(), new TypeReference<>() {});
                List<Map<String, Object>> result = new ArrayList<>();
                for (var block : blocks) {
                    if (block == null || block.isEmpty()) continue;
                    String classesCsv = (String) block.get("classes");
                    if (classesCsv == null || classesCsv.isBlank()) continue;

                    List<Long> ids = Arrays.stream(classesCsv.split(","))
                            .map(String::trim).map(Long::parseLong).toList();

                    var items = itemRepository.findByIdsOrdered(ids, classesCsv);
                    Object titleObj = block.get("title");
                    String title = titleObj instanceof Map<?, ?> m
                            ? String.valueOf(m.containsKey("vi") ? m.get("vi") : m.values().iterator().next())
                            : String.valueOf(titleObj);

                    result.add(Map.of("title", title, "classes", items));
                }
                return result;
            } catch (Exception e) {
                log.warn("Failed to parse home_special_classes: {}", e.getMessage());
                return new ArrayList<Map<String, Object>>();
            }
        }).orElse(new ArrayList<>());
    }

    public List<?> getAllCategories() {
        return categoryRepository.findCategoriesWithActiveItems();
    }

    private List<Map<String, Object>> getCategoriesWithItems() {
        var categories = categoryRepository.findCategoriesWithActiveItems();
        return categories.stream().map(cat -> {
            var items = itemRepository.findByItemCategoryIdAndStatusAndUserStatusOrderByBoostScoreDesc(
                    cat.getId().intValue(), (byte) 1, (byte) 1, PageRequest.of(0, 10));
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", cat.getId());
            m.put("title", cat.getTitle());
            m.put("url", cat.getUrl());
            m.put("items", items);
            return m;
        }).toList();
    }

    public List<?> getItemsByIds(List<Long> ids) {
        var itemMap = itemRepository.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(i -> i.getId(), i -> i));
        // preserve Meilisearch rank order
        return ids.stream().map(itemMap::get).filter(Objects::nonNull).toList();
    }

    public List<String> searchTags(String q) {
        return tagRepository.findDistinctActiveTags(q);
    }
}
