package com.anylearn.backend.service;

import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * All wallet_c / wallet_m mutations go through here.
 * Uses pessimistic DB lock on the user row to prevent concurrent balance corruption.
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;

    @Transactional
    public void creditWalletC(Long userId, long amount) {
        if (amount <= 0) return;
        userRepository.findByIdWithLock(userId).ifPresent(u -> {
            u.setWalletC((u.getWalletC() != null ? u.getWalletC() : 0L) + amount);
            userRepository.save(u);
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
        });
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
