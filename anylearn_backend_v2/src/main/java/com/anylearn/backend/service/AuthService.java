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
@lombok.extern.slf4j.Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.anylearn.backend.service.referral.ReferralService referralService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private EmailTemplateService emailTemplateService;

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

    public LoginResponse register(String name, String phone, String email, String password) {
        return register(name, phone, email, password, null, null);
    }

    /** {@code ref} is the referrer's code (their phone) from a /ref link; a wrong code is ignored, never an error. */
    public LoginResponse register(String name, String phone, String email, String password, String ref, String game) {
        if (userRepository.findByPhone(phone).isPresent()) {
            throw new IllegalArgumentException("Số điện thoại này đã được đăng ký.");
        }

        User user = new User();
        user.setName(name);
        user.setPhone(phone);
        user.setRefcode(phone);
        user.setEmail(email != null ? email : "");
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("user");
        NewUserDefaults.apply(user);
        user.setApiToken(generateApiToken());

        User referrer = referralService.findReferrer(ref, phone).orElse(null);
        if (referrer != null) user.setUserId(referrer.getId());

        userRepository.save(user);
        if (referrer != null) referralService.record(referrer, user, game);
        if (emailTemplateService != null && !user.getEmail().isBlank()) {
            try {
                emailTemplateService.sendToUser(user.getId(), "email-user_register", "Chào mừng bạn đến với anyLEARN",
                        java.util.Map.of("phone", phone));
            } catch (Exception e) {
                log.warn("[register] welcome email failed for user {}: {}", user.getId(), e.getMessage());
            }
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
