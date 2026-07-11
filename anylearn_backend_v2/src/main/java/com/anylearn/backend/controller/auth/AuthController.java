package com.anylearn.backend.controller.auth;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    @GetMapping("/login")
    public ApiResponse<?> login(@RequestParam String phone, @RequestParam String password) {
        // TODO: implement
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/login/facebook")
    public ApiResponse<?> loginFacebook(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/login/apple")
    public ApiResponse<?> loginApple(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/logout")
    public ApiResponse<?> logout() {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/register")
    public ApiResponse<?> register(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
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
