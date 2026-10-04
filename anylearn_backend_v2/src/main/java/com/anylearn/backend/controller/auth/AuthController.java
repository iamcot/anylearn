package com.anylearn.backend.controller.auth;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.dto.response.LoginResponse;
import com.anylearn.backend.service.AuthService;
import com.anylearn.backend.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @GetMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestParam String phone, @RequestParam String password) {
        return ApiResponse.ok(authService.login(phone, password));
    }

    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(@RequestBody Map<String, String> body) {
        return ApiResponse.ok(authService.register(
                body.get("name"), body.get("phone"), body.get("email"), body.get("password")));
    }

    @PostMapping("/simple-register")
    public ApiResponse<?> simpleRegister(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/password/otp")
    public ApiResponse<?> sendOtpResetPass(@RequestParam String phone) {
        try {
            passwordResetService.requestPasswordReset(phone);
            return ApiResponse.ok("OTP đã được gửi tới số điện thoại của bạn.");
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/otp/check")
    public ApiResponse<?> otpCheck(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String otp = body.get("otp");
        if (phone == null || otp == null) {
            return ApiResponse.fail("Thiếu thông tin phone hoặc otp.");
        }
        try {
            String resetToken = passwordResetService.verifyOtpAndGenerateToken(phone, otp);
            return ApiResponse.ok(Map.of("resetToken", resetToken));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/password/reset")
    public ApiResponse<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || newPassword == null) {
            return ApiResponse.fail("Thiếu thông tin token hoặc newPassword.");
        }
        if (newPassword.length() < 6) {
            return ApiResponse.fail("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        try {
            passwordResetService.resetPassword(token, newPassword);
            return ApiResponse.ok("Mật khẩu đã được cập nhật thành công.");
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
