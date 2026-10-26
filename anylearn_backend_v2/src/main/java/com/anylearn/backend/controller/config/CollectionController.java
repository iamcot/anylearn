package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.collections.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ApiResponse<?> list() {
        return ApiResponse.ok(collectionService.listPublic(LocalDate.now()));
    }

    @GetMapping("/{slug}")
    public ApiResponse<?> get(@PathVariable String slug) {
        return collectionService.getPublic(slug, LocalDate.now()).<ApiResponse<?>>map(ApiResponse::ok)
                .orElseGet(() -> ApiResponse.fail("Không tìm thấy bộ sưu tập"));
    }
}
