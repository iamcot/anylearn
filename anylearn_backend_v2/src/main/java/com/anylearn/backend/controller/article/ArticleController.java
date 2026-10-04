package com.anylearn.backend.controller.article;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleRepository articleRepository;

    @GetMapping("/article")
    public ApiResponse<?> index(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String type) {

        var pageable = PageRequest.of(page, limit);
        List<String> types = (type != null && !type.isBlank())
                ? List.of(type)
                : List.of("read", "video", "event", "promotion");

        var items = (type != null && !type.isBlank())
                ? articleRepository.findLightByStatusAndType((byte) 1, type, pageable)
                : articleRepository.findLightByStatusAndTypeIn((byte) 1, types, pageable);

        long total = (type != null && !type.isBlank())
                ? articleRepository.countByStatusAndType((byte) 1, type)
                : articleRepository.countByStatusAndTypeIn((byte) 1, types);

        return ApiResponse.ok(Map.of("items", items, "page", page, "limit", limit, "total", total));
    }

    @GetMapping("/article/cat/{type}")
    public ApiResponse<?> loadByType(
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int limit) {

        var pageable = PageRequest.of(page, limit);
        var items = articleRepository.findLightByStatusAndType((byte) 1, type, pageable);
        long total = articleRepository.countByStatusAndType((byte) 1, type);
        return ApiResponse.ok(Map.of("items", items, "page", page, "limit", limit, "total", total));
    }

    @GetMapping("/article/{id}")
    public ApiResponse<?> loadArticle(@PathVariable Long id) {
        return articleRepository.findById(id)
                .filter(a -> a.getStatus() == 1)
                .<ApiResponse<?>>map(ApiResponse::ok)
                .orElse(ApiResponse.fail("Bài viết không tồn tại"));
    }

    @GetMapping("/quote")
    public ApiResponse<?> quote() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/v3/articles")
    public ApiResponse<?> articles() {
        return ApiResponse.fail("Not implemented");
    }
}
