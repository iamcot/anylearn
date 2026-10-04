package com.anylearn.backend.service;

import com.anylearn.backend.entity.PasswordResetToken;
import com.anylearn.backend.repository.PasswordResetTokenRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class PasswordResetService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    public void requestPasswordReset(String phone) throws Exception {
        userRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("Số điện thoại chưa được đăng ký."));
        otpService.generateAndSendOtp(phone, OtpService.PURPOSE_PASSWORD_RESET);
    }

    public String verifyOtpAndGenerateToken(String phone, String otp) {
        if (!otpService.verifyOtp(phone, otp, OtpService.PURPOSE_PASSWORD_RESET)) {
            throw new IllegalArgumentException("OTP không đúng hoặc đã hết hạn.");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setPhone(phone);
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(resetToken);
        return token;
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ hoặc đã hết hạn."));

        if (LocalDateTime.now().isAfter(resetToken.getExpiresAt())) {
            throw new IllegalArgumentException("Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.");
        }

        userRepository.findByPhone(resetToken.getPhone()).ifPresent(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        });

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        log.info("[PASSWORD_RESET] Password reset for phone {}", resetToken.getPhone());
    }

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.debug("[PASSWORD_RESET] Cleaned up expired tokens");
    }
}
