package com.anylearn.backend.controller.item;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ItemController {

    @GetMapping("/pdp/{id}")
    public ApiResponse<?> pdp(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/{itemId}/reviews")
    public ApiResponse<?> reviews(@PathVariable Long itemId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/user/{userId}/items")
    public ApiResponse<?> userItems(@PathVariable Long userId) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/create")
    public ApiResponse<?> create(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/update")
    public ApiResponse<?> update(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/updateitem")
    public ApiResponse<?> updateItem(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/{id}/edit")
    public ApiResponse<?> edit(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{id}/edit")
    public ApiResponse<?> save(@PathVariable Long id, @RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/list")
    public ApiResponse<?> list() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{itemId}/upload-image")
    public ApiResponse<?> uploadImage(@PathVariable Long itemId, @RequestParam MultipartFile file) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/{itemId}/user-status/{newStatus}")
    public ApiResponse<?> changeUserStatus(@PathVariable Long itemId, @PathVariable Integer newStatus) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/schadule/{id}")
    public ApiResponse<?> schadule(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/update-schadule")
    public ApiResponse<?> updateSchedule(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/location")
    public ApiResponse<?> userLocation() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{id}/share")
    public ApiResponse<?> share(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/item/{itemId}/touch-fav")
    public ApiResponse<?> touchFav(@PathVariable Long itemId) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/item/{itemId}/save-rating")
    public ApiResponse<?> saveRating(@PathVariable Long itemId, @RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }
}
