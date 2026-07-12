package com.anylearn.backend.service;

import com.anylearn.backend.dto.response.LoginResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(String phone, String password) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("Thông tin xác thực không hợp lệ"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Thông tin xác thực không hợp lệ");
        }

        if (user.getStatus() == 0) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị khóa.");
        }

        if (user.getApiToken() == null || user.getApiToken().isBlank()) {
            user.setApiToken(generateApiToken());
            userRepository.save(user);
        }

        return new LoginResponse(user, jwtService.generateToken(user.getId()));
    }

    private String generateApiToken() {
        try {
            byte[] random = new byte[60];
            new SecureRandom().nextBytes(random);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(random);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate token", e);
        }
    }
}
