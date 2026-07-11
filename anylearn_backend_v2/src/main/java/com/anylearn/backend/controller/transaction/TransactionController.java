package com.anylearn.backend.controller.transaction;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transaction")
public class TransactionController {

    @GetMapping("/history")
    public ApiResponse<?> history() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/deposit")
    public ApiResponse<?> saveDeposit(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/exchange")
    public ApiResponse<?> saveExchange(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/withdraw")
    public ApiResponse<?> saveWithdraw(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/register/{itemId}")
    public ApiResponse<?> placeOrderOneItem(@PathVariable Long itemId) {
        return ApiResponse.fail("Not implemented");
    }
}
