package com.anylearn.backend.controller.auth;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.dto.response.LoginResponse;
import com.anylearn.backend.service.AuthService;
import com.anylearn.backend.service.PasswordResetService;
import com.anylearn.backend.service.acquisition.AcquisitionService;
import com.anylearn.backend.service.signup.SignupGuard;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Slf4j
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final AcquisitionService acquisitionService;
    private final SignupGuard signupGuard;

    @GetMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestParam String phone, @RequestParam String password) {
        return ApiResponse.ok(authService.login(phone, password));
    }

    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String ip = clientIp(request);
        long now = System.currentTimeMillis();
        if (!signupGuard.allowed(ip, now)) {
            log.warn("[register] too many registrations from ip {}", ip);
            return ApiResponse.fail("Bạn đã đăng ký quá nhiều tài khoản. Vui lòng thử lại sau.");
        }
        LoginResponse response = authService.register(
                body.get("name"), body.get("phone"), body.get("email"), body.get("password"),
                body.get("ref"), body.get("game"), body.get("ach"));
        // where the new account came from (plan 19.A4): UTM values the browser kept, the landing address, the referral code
        acquisitionService.recordSignup(response.getId(), body, body.get("ref"));
        signupGuard.record(ip, now);
        return ApiResponse.ok(response);
    }

    /** nginx sets X-Real-IP to the real client; the first X-Forwarded-For value can be written by the client, so it is the fallback only. */
    private static String clientIp(HttpServletRequest request) {
        String real = request.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
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
