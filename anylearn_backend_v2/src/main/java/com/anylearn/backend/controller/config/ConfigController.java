package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.KnowledgeRepository;
import com.anylearn.backend.repository.KnowledgeTopicCategoryLinkRepository;
import com.anylearn.backend.repository.KnowledgeTopicRepository;
import com.anylearn.backend.repository.VoucherGroupRepository;
import com.anylearn.backend.repository.VoucherRepository;
import com.anylearn.backend.service.ConfigService;
import com.anylearn.backend.service.MeilisearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;
    private final MeilisearchService meilisearchService;
    private final VoucherRepository voucherRepository;
    private final VoucherGroupRepository voucherGroupRepository;
    private final ConfigurationRepository configurationRepository;
    private final KnowledgeRepository knowledgeRepository;
    private final KnowledgeTopicRepository knowledgeTopicRepository;
    private final KnowledgeTopicCategoryLinkRepository knowledgeTopicCategoryLinkRepository;

    @GetMapping({"/config/homev2/{role}", "/config/homev2"})
    public ApiResponse<?> homeV2(@PathVariable(required = false) String role) {
        return ApiResponse.ok(configService.homeV2(role != null ? role : "buyer"));
    }

    @GetMapping("/config/category")
    public ApiResponse<?> category(@RequestParam(required = false) Long catId) {
        return ApiResponse.ok(configService.getAllCategories());
    }

    @GetMapping("/event/{month}")
    public ApiResponse<?> event(@PathVariable String month) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/search")
    public ApiResponse<?> search(@RequestParam(required = false) String q,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int pageSize,
                                  @RequestParam(required = false) String category,
                                  @RequestParam(required = false) String sort,
                                  @RequestParam(required = false) Long authorId,
                                  @RequestParam(required = false) String age,
                                  @RequestParam(required = false) String priceRange,
                                  @RequestParam(required = false) String location,
                                  @RequestParam(required = false) String mode) {
        var result = meilisearchService.search(q, page, pageSize, category, sort, authorId, age, priceRange, location, mode);
        return ApiResponse.ok(result);
    }

    @GetMapping("/search-tags")
    public ApiResponse<?> searchTags(@RequestParam(required = false) String q) {
        return ApiResponse.ok(configService.searchTags(q));
    }

    @GetMapping("/search/users")
    public ApiResponse<?> searchUsers(@RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int pageSize,
                                       @RequestParam(required = false) String role,
                                       @RequestParam(required = false) String sort,
                                       @RequestParam(required = false) Long authorId) {
        var result = meilisearchService.searchUsers(q, role, page, pageSize, sort, authorId);
        return ApiResponse.ok(result);
    }

    @GetMapping("/foundation")
    public ApiResponse<?> foundation() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/doc/{key}")
    public ApiResponse<?> getDoc(@PathVariable String key) {
        return configurationRepository.findByKey(key)
                .map(c -> {
                    Map<String, Object> res = new LinkedHashMap<>();
                    res.put("content", c.getValue());
                    res.put("updatedAt", c.getUpdatedAt());
                    return ApiResponse.ok(res);
                })
                .orElse(ApiResponse.fail("Không tìm thấy tài liệu"));
    }

    @GetMapping("/helpcenter/top")
    public ApiResponse<?> helpcenterTop(@RequestParam(defaultValue = "buyer") String type,
                                         @RequestParam(defaultValue = "4") int limit) {
        var items = knowledgeRepository.findTopByType(type, PageRequest.of(0, limit));
        var result = items.stream().map(k -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", k.getId());
            m.put("title", k.getTitle());
            m.put("url", k.getUrl());
            return m;
        }).toList();
        return ApiResponse.ok(result);
    }

    @GetMapping("/helpcenter")
    public ApiResponse<?> helpcenterIndex() {
        var topKnowledge = knowledgeRepository.findTopByType("buyer", PageRequest.of(0, 10))
                .stream().map(k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", k.getId()); m.put("title", k.getTitle()); m.put("url", k.getUrl());
                    return m;
                }).toList();
        var topics = knowledgeTopicRepository.findByTypeAndStatusGreaterThanOrderByIdAsc("buyer", (byte) 0)
                .stream().map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId()); m.put("title", t.getTitle()); m.put("url", t.getUrl());
                    m.put("image", t.getImage()); m.put("description", t.getDescription());
                    return m;
                }).toList();
        return ApiResponse.ok(Map.of("topKnowledge", topKnowledge, "topics", topics));
    }

    @GetMapping("/helpcenter/article/{id}")
    public ApiResponse<?> helpcenterArticle(@PathVariable Long id) {
        return knowledgeRepository.findById(id).map(k -> {
            var others = knowledgeRepository
                    .findTopByType(k.getType(), PageRequest.of(0, 6))
                    .stream().filter(o -> !o.getId().equals(id))
                    .limit(5)
                    .map(o -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", o.getId()); m.put("title", o.getTitle()); m.put("url", o.getUrl());
                        return m;
                    }).toList();
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("id", k.getId()); res.put("title", k.getTitle()); res.put("url", k.getUrl());
            res.put("content", k.getContent()); res.put("updatedAt", k.getUpdatedAt());
            res.put("others", others);
            return ApiResponse.ok(res);
        }).orElse(ApiResponse.fail("Không tìm thấy bài viết"));
    }

    @GetMapping("/helpcenter/topic/{url}")
    public ApiResponse<?> helpcenterTopic(@PathVariable String url) {
        var topic = knowledgeTopicRepository.findByTypeAndStatusGreaterThanOrderByIdAsc("buyer", (byte) 0)
                .stream().filter(t -> url.equals(t.getUrl())).findFirst().orElse(null);
        if (topic == null) return ApiResponse.fail("Không tìm thấy chủ đề");

        var categoryIds = knowledgeTopicCategoryLinkRepository.findByKnowledgeTopicId(topic.getId())
                .stream().map(l -> l.getKnowledgeCategoryId()).toList();
        var knowledge = categoryIds.isEmpty() ? java.util.List.of() : knowledgeRepository.findByCategoryIds(categoryIds)
                .stream().map(k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", k.getId()); m.put("title", k.getTitle()); m.put("url", k.getUrl());
                    return m;
                }).toList();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", topic.getId()); res.put("title", topic.getTitle()); res.put("url", topic.getUrl());
        res.put("knowledge", knowledge);
        return ApiResponse.ok(res);
    }

    @PostMapping("/report/ecommerce")
    public ApiResponse<?> reportEcommerce(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/config/feedback")
    public ApiResponse<?> saveFeedback(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/config/transaction/{type}")
    public ApiResponse<?> transaction(@PathVariable String type) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/voucher/check")
    public ApiResponse<?> checkVoucher(@RequestParam String code, @RequestParam(required = false) Long orderAmount) {
        var opt = voucherRepository.findByVoucher(code.trim());
        if (opt.isEmpty()) return ApiResponse.fail("Mã khuyến mãi không tồn tại");

        var v = opt.get();
        if (v.getStatus() == null || v.getStatus() != 1)
            return ApiResponse.fail("Mã khuyến mãi đã được sử dụng hoặc không còn hiệu lực");
        if (v.getExpired() != null && v.getExpired() > 0 && v.getExpired() < System.currentTimeMillis() / 1000)
            return ApiResponse.fail("Mã khuyến mãi đã hết hạn");

        var group = voucherGroupRepository.findById(v.getVoucherGroupId()).orElse(null);
        if (group == null || group.getStatus() != 1)
            return ApiResponse.fail("Mã khuyến mãi không hợp lệ");

        // Rule check (min order amount)
        if (group.getRuleMin() != null && orderAmount != null && orderAmount < group.getRuleMin())
            return ApiResponse.fail("Đơn hàng tối thiểu " + String.format("%,d", group.getRuleMin()) + " đ để dùng mã này");

        long discountValue;
        try { discountValue = Long.parseLong(group.getValue()); } catch (Exception e) { discountValue = 0; }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", v.getVoucher());
        result.put("type", group.getType());          // money | class
        result.put("discountValue", discountValue);   // VND amount
        result.put("message", "Áp dụng thành công! Giảm " + String.format("%,d", discountValue) + " đ");
        return ApiResponse.ok(result);
    }
}
