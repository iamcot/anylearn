package com.anylearn.backend.controller.transaction;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;

    private static final List<String> USER_VISIBLE_TYPES =
            List.of("exchange", "commission", "partner", "withdraw", "deposit", "commission_add");

    /**
     * GET /api/transaction/history
     * Returns the authenticated user's anyPoint transaction history (wallet_c movements).
     * Query params: page (0-based), size (default 20)
     */
    @GetMapping("/history")
    public ApiResponse<?> history(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");

        var transactions = transactionRepository.findByUserIdOrderedPaged(user.getId(), size, (long) page * size);
        var content = transactions.stream().map(t -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", t.getId());
            m.put("type", t.getType());
            m.put("amount", t.getAmount());
            m.put("payMethod", t.getPayMethod());
            m.put("content", t.getContent());
            m.put("status", t.getStatus());
            m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            return m;
        }).toList();
        return ApiResponse.ok(Map.of("content", content, "page", page, "size", size));
    }

    /**
     * POST /api/transaction/deposit — stub (top-up via bank transfer, handled by admin later)
     */
    @PostMapping("/deposit")
    public ApiResponse<?> saveDeposit(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    /**
     * POST /api/transaction/exchange — stub (anyPoint spend handled at checkout)
     */
    @PostMapping("/exchange")
    public ApiResponse<?> saveExchange(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    /**
     * POST /api/transaction/withdraw
     * Partner requests to convert anyPoints → cash (pending admin approval).
     * Points are held immediately to prevent double-spending.
     * Body: { amount: long, bankInfo: string }
     */
    @PostMapping("/withdraw")
    public ApiResponse<?> saveWithdraw(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");

        Object amountObj = body.get("amount");
        if (amountObj == null) return ApiResponse.fail("amount là bắt buộc");
        long amount;
        try { amount = ((Number) amountObj).longValue(); } catch (Exception e) { return ApiResponse.fail("amount không hợp lệ"); }
        if (amount <= 0) return ApiResponse.fail("amount phải > 0");

        String bankInfo = body.containsKey("bankInfo") ? String.valueOf(body.get("bankInfo")) : null;

        // Debit wallet_c immediately — holds the points so they can't be spent elsewhere
        try {
            walletService.debitWalletC(user.getId(), amount);
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }

        Transaction tx = new Transaction();
        tx.setUserId(user.getId());
        tx.setType("withdraw");
        tx.setAmount(-amount);
        tx.setPayMethod("bank_transfer");
        tx.setContent("Yêu cầu rút " + amount + " anyPoint" + (bankInfo != null ? " | " + bankInfo : ""));
        tx.setStatus(0); // pending admin approval
        tx.setCreatedAt(LocalDateTime.now());
        tx.setUpdatedAt(LocalDateTime.now());
        Transaction saved = transactionRepository.save(tx);

        return ApiResponse.ok(Map.of("transactionId", saved.getId(), "amount", amount, "status", "pending"));
    }

    @GetMapping("/register/{itemId}")
    public ApiResponse<?> placeOrderOneItem(@PathVariable Long itemId) {
        return ApiResponse.fail("Not implemented");
    }
}
