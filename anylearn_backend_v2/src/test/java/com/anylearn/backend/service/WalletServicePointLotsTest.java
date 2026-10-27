package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.points.expiry.PointLotLedger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Only members get lots of points (and so a deadline); the balance itself changes as before.
class WalletServicePointLotsTest {

    private UserRepository users;
    private PointLotLedger ledger;
    private WalletService wallet;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        ledger = mock(PointLotLedger.class);
        wallet = new WalletService(users, ledger);
    }

    private User user(long id, String role, long walletC) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setWalletC(walletC);
        when(users.findByIdWithLock(id)).thenReturn(Optional.of(u));
        return u;
    }

    @Test
    void creditingAMemberAddsALot() {
        User member = user(1L, "member", 10);
        wallet.creditWalletC(1L, 25);
        assertThat(member.getWalletC()).isEqualTo(35);
        verify(ledger).add(eq(1L), eq(25L), any(LocalDateTime.class));
    }

    @Test
    void creditingAPartnerAddsNoLot() {
        User partner = user(2L, "school", 0);
        wallet.creditWalletC(2L, 25);
        assertThat(partner.getWalletC()).isEqualTo(25);
        verify(ledger, never()).add(any(), any(Long.class), any());
    }

    @Test
    void debitingAMemberSpendsTheLots() {
        User member = user(1L, "member", 100);
        wallet.debitWalletC(1L, 40);
        assertThat(member.getWalletC()).isEqualTo(60);
        verify(ledger).spend(1L, 40);
    }

    @Test
    void debitingMoreThanTheBalanceFailsAndTouchesNoLot() {
        user(1L, "member", 10);
        assertThatThrownBy(() -> wallet.debitWalletC(1L, 40)).isInstanceOf(IllegalStateException.class);
        verify(ledger, never()).spend(any(), any(Long.class));
    }

    @Test
    void debitingAPartnerTouchesNoLot() {
        user(2L, "school", 100);
        wallet.debitWalletC(2L, 40);
        verify(ledger, never()).spend(any(), any(Long.class));
    }

    @Test
    void expiringNeverTakesMoreThanTheBalance() {
        User member = user(1L, "member", 30);
        assertThat(wallet.expireWalletC(1L, 50)).isEqualTo(30);
        assertThat(member.getWalletC()).isZero();
        verify(ledger, never()).spend(any(), any(Long.class));
    }
}
