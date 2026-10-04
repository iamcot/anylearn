package com.anylearn.backend.service;

import com.anylearn.backend.entity.OtpVerification;
import com.anylearn.backend.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class OtpService {

    public static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";
    public static final String PURPOSE_PHONE_VERIFY = "PHONE_VERIFY";

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_OTP_PER_DAY = 5;

    @Value("${zalo.zns.testMode:true}")
    private boolean testMode;

    private final OtpVerificationRepository otpRepository;
    private final ZnsService znsService;

    public void generateAndSendOtp(String phone, String purpose) throws Exception {
        LocalDateTime dayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long countToday = otpRepository.countByPhoneAndPurposeAndCreatedAtAfter(phone, purpose, dayStart);

        if (!testMode && countToday >= MAX_OTP_PER_DAY) {
            throw new IllegalStateException("Bạn đã yêu cầu OTP quá nhiều lần hôm nay. Vui lòng thử lại vào ngày mai.");
        }

        String otpCode = String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 1000000));

        OtpVerification otp = new OtpVerification();
        otp.setPhone(phone);
        otp.setOtpCode(otpCode);
        otp.setPurpose(purpose);
        otp.setVerified(false);
        otp.setAttempts(0);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpRepository.save(otp);

        log.info("[OTP] Generated {} for phone {} purpose {}", testMode ? otpCode : "******", phone, purpose);

        try {
            znsService.sendOtp(phone, otpCode);
        } catch (Exception e) {
            log.error("[OTP] Failed to send OTP via ZNS: {}", e.getMessage());
            throw new RuntimeException("Không thể gửi OTP tới số điện thoại của bạn. Vui lòng thử lại.");
        }
    }

    public boolean verifyOtp(String phone, String otpCode, String purpose) {
        var otpOpt = otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(phone, purpose);

        if (otpOpt.isEmpty()) return false;

        OtpVerification otp = otpOpt.get();

        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) return false;
        if (otp.getAttempts() >= MAX_ATTEMPTS) return false;

        otp.setAttempts(otp.getAttempts() + 1);

        if (otp.getOtpCode().equals(otpCode)) {
            otp.setVerified(true);
            otpRepository.save(otp);
            return true;
        }

        otpRepository.save(otp);
        return false;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.debug("[OTP] Cleaned up expired OTPs");
    }
}
