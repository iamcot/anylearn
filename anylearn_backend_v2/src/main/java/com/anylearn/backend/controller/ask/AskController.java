package com.anylearn.backend.controller.ask;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ask")
public class AskController {

    @GetMapping("/list")
    public ApiResponse<?> getList() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/{askId}")
    public ApiResponse<?> getThread(@PathVariable Long askId) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/create/{type}")
    public ApiResponse<?> create(@PathVariable String type, @RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/{askId}/edit")
    public ApiResponse<?> edit(@PathVariable Long askId, @RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/{askId}/select")
    public ApiResponse<?> selectAnswer(@PathVariable Long askId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/{askId}/vote/{type}")
    public ApiResponse<?> vote(@PathVariable Long askId, @PathVariable String type) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/{askId}/touch/{status}")
    public ApiResponse<?> touchStatus(@PathVariable Long askId, @PathVariable Integer status) {
        return ApiResponse.fail("Not implemented");
    }
}
