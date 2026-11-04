package com.anylearn.backend.service;

import com.anylearn.backend.dto.response.LoginResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
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

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.anylearn.backend.service.sticker.WelcomePackService welcomePackService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.anylearn.backend.service.guestquiz.GuestQuizService guestQuizService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.anylearn.backend.service.voucher.VoucherService voucherService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.anylearn.backend.service.achievement.AchievementService achievementService;

    public LoginResponse login(String phone, String password) {
        User user = userRepository.findByPhone(phone)
                .or(() -> {
                    // registration stores the phone normalized (+84 → 0, no spaces): accept the same typing at login
                    String normalized = com.anylearn.backend.service.signup.SignupRules.normalizePhone(phone);
                    return normalized == null || normalized.equals(phone) ? java.util.Optional.empty() : userRepository.findByPhone(normalized);
                })
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
        return register(name, phone, email, password, ref, game, null);
    }

    /** {@code ach} is the token of the achievement banner whose share page the person came from (reports only). */
    public LoginResponse register(String name, String rawPhone, String email, String password, String ref, String game, String ach) {
        String phone = com.anylearn.backend.service.signup.SignupRules.normalizePhone(rawPhone);
        String problem = com.anylearn.backend.service.signup.SignupRules.problem(name, phone, email, password);
        if (problem != null) throw new IllegalArgumentException(problem);
        name = name.trim();
        if (userRepository.findByPhone(phone).isPresent()) {
            throw new IllegalArgumentException("Số điện thoại này đã được đăng ký.");
        }

        User user = new User();
        user.setName(name);
        user.setPhone(phone);
        user.setRefcode(phone);
        user.setEmail(email != null ? email.trim() : "");
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("member");
        NewUserDefaults.apply(user);
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setApiToken(generateApiToken());

        User referrer = referralService.findReferrer(ref, phone).orElse(null);
        if (referrer != null) user.setUserId(referrer.getId());

        userRepository.save(user);
        if (referrer != null) referralService.record(referrer, user, game);
        if (referrer != null && ach != null && achievementService != null) achievementService.attachSignup(ach, user.getId());
        if (referrer != null && welcomePackService != null) welcomePackService.start(referrer, user);
        if (voucherService != null) voucherService.fire("register", user.getId(), 0); // plan 20: welcome vouchers, never throws
        if (guestQuizService != null && com.anylearn.backend.service.guestquiz.GuestQuizService.GAME.equals(game)) guestQuizService.onSignup(user.getId());
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
