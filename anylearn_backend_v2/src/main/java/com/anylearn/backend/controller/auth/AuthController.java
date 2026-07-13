package com.anylearn.backend.controller.auth;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.dto.response.LoginResponse;
import com.anylearn.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestParam String phone, @RequestParam String password) {
        return ApiResponse.ok(authService.login(phone, password));
    }

    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(@RequestBody Map<String, String> body) {
        return ApiResponse.ok(authService.register(
                body.get("name"),
                body.get("phone"),
                body.get("email"),
                body.get("password")
        ));
    }

    @PostMapping("/simple-register")
    public ApiResponse<?> simpleRegister(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/password/otp")
    public ApiResponse<?> sentOtpResetPass(@RequestParam String phone) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/password/reset")
    public ApiResponse<?> resetPassOtp(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/otp/check")
    public ApiResponse<?> otpCheck(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }
}
