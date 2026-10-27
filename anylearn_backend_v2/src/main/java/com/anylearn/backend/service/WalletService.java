package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.points.expiry.PointLotLedger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * All wallet_c / wallet_m mutations go through here.
 * Uses pessimistic DB lock on the user row to prevent concurrent balance corruption.
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final PointLotLedger pointLotLedger;

    private static boolean isMember(User u) {
        return "member".equals(u.getRole());
    }

    @Transactional
    public void creditWalletC(Long userId, long amount) {
        if (amount <= 0) return;
        userRepository.findByIdWithLock(userId).ifPresent(u -> {
            u.setWalletC((u.getWalletC() != null ? u.getWalletC() : 0L) + amount);
            userRepository.save(u);
            if (isMember(u)) pointLotLedger.add(userId, amount, LocalDateTime.now());
        });
    }

    @Transactional
    public void debitWalletC(Long userId, long amount) {
        if (amount <= 0) return;
        userRepository.findByIdWithLock(userId).ifPresent(u -> {
            long current = u.getWalletC() != null ? u.getWalletC() : 0L;
            if (current < amount)
                throw new IllegalStateException("Số dư anyPoint không đủ: cần " + amount + ", có " + current);
            u.setWalletC(current - amount);
            userRepository.save(u);
            if (isMember(u)) pointLotLedger.spend(userId, amount);
        });
    }

    /**
     * Takes expired points off the balance (the caller zeroes the lots and writes the transaction). Never more than the
     * balance; returns what was taken.
     */
    @Transactional
    public long expireWalletC(Long userId, long amount) {
        if (amount <= 0) return 0;
        return userRepository.findByIdWithLock(userId).map(u -> {
            long current = u.getWalletC() != null ? u.getWalletC() : 0L;
            long taken = Math.min(current, amount);
            u.setWalletC(current - taken);
            userRepository.save(u);
            return taken;
        }).orElse(0L);
    }

    @Transactional
    public void creditWalletM(Long userId, long amount) {
        if (amount <= 0) return;
        userRepository.findByIdWithLock(userId).ifPresent(u -> {
            u.setWalletM((u.getWalletM() != null ? u.getWalletM() : 0L) + amount);
            userRepository.save(u);
        });
    }
}
