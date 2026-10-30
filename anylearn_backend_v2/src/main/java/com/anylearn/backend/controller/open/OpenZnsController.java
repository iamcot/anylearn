package com.anylearn.backend.controller.open;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.ZnsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * Sends a ZNS OTP on behalf of a partner app (e.g. 11 On Field) through AnyLearn's Zalo OA.
 * The partner generates and verifies the code itself; this only delivers it.
 * Disabled until ZNS_PARTNER_API_KEY is set.
 */
@RestController
@RequestMapping("/api/open/zns")
@RequiredArgsConstructor
@Slf4j
public class OpenZnsController {

    private final ZnsService znsService;

    @Value("${zalo.zns.partnerApiKey:}")
    private String partnerApiKey;

    @PostMapping("/otp")
    public ResponseEntity<ApiResponse<?>> sendOtp(@RequestHeader(value = "X-Api-Key", required = false) String apiKey,
                                                  @RequestBody Map<String, String> body) {
        if (partnerApiKey == null || partnerApiKey.isBlank() || apiKey == null
                || !MessageDigest.isEqual(partnerApiKey.getBytes(StandardCharsets.UTF_8), apiKey.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("Forbidden"));
        }
        String phone = body.get("phone");
        String otp = body.get("otp");
        if (phone == null || !phone.matches("\\+?[0-9 .-]{9,15}") || otp == null || !otp.matches("[0-9]{4,8}")) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Thiếu hoặc sai phone/otp."));
        }
        try {
            znsService.sendOtp(phone, otp);
            return ResponseEntity.ok(ApiResponse.ok("sent"));
        } catch (Exception e) {
            log.error("[ZNS partner] Failed to send OTP to {}: {}", phone, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.fail("Không gửi được OTP qua ZNS."));
        }
    }
}
