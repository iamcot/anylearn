package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.repository.VoucherGroupRepository;
import com.anylearn.backend.repository.VoucherRepository;
import com.anylearn.backend.service.ConfigService;
import com.anylearn.backend.service.MeilisearchService;
import lombok.RequiredArgsConstructor;
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
        return ApiResponse.fail("Not implemented");
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
