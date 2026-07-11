package com.anylearn.backend.dto.response;

public record ApiResponse<T>(int resultCode, String message, T data) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(1, "", data);
    }

    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(1, "", null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(0, message, null);
    }
}
