package com.anylearn.backend.service.points.expiry;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.points.expiry.PointExpiryRules.Lot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PointExpiryServiceTest {

    private JdbcTemplate jdbc;
    private PointExpirySettings settings;
    private PointLotLedger ledger;
    private WalletService wallet;
    private TransactionRepository transactions;
    private NotificationService notifications;
    private TransactionTemplate tx;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        settings = mock(PointExpirySettings.class);
        ledger = mock(PointLotLedger.class);
        wallet = mock(WalletService.class);
        transactions = mock(TransactionRepository.class);
        notifications = mock(NotificationService.class);
        tx = mock(TransactionTemplate.class);
        when(tx.execute(any())).thenAnswer(call -> ((TransactionCallback<?>) call.getArgument(0)).doInTransaction(null));
        when(settings.enabled()).thenReturn(true);
        when(settings.months()).thenReturn(12);
        when(settings.startDate()).thenReturn(LocalDate.of(2027, 1, 1));
        when(jdbc.queryForList(anyString(), eq(Long.class), any(Object[].class))).thenReturn(List.of(7L));
        when(jdbc.queryForList(anyString(), eq(Long.class))).thenReturn(List.of(7L));
    }

    private PointExpiryService on(LocalDate today) {
        Clock clock = Clock.fixed(today.atTime(0, 10).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant(), ZoneId.of("Asia/Ho_Chi_Minh"));
        return new PointExpiryService(jdbc, settings, ledger, mock(UserRepository.class), wallet, transactions, notifications, tx, clock);
    }

    @Test
    void nothingIsRemovedBeforeTheFirstExpiryDay() {
        assertThat(on(LocalDate.of(2027, 12, 31)).expireDue()).isZero();
        verify(wallet, never()).expireWalletC(anyLong(), anyLong());
        verify(transactions, never()).save(any());
    }

    @Test
    void nothingIsRemovedWhenSwitchedOff() {
        when(settings.enabled()).thenReturn(false);
        assertThat(on(LocalDate.of(2030, 1, 1)).expireDue()).isZero();
        verify(wallet, never()).expireWalletC(anyLong(), anyLong());
    }

    @Test
    void dueLotsAreRemovedWithATransaction() {
        when(ledger.open(7L)).thenReturn(List.of(new Lot(1, 100, LocalDate.of(2026, 11, 1)), new Lot(2, 40, LocalDate.of(2027, 6, 1))));
        when(wallet.expireWalletC(7L, 100)).thenReturn(100L);

        assertThat(on(LocalDate.of(2028, 1, 1)).expireDue()).isEqualTo(1);

        ArgumentCaptor<Transaction> saved = ArgumentCaptor.forClass(Transaction.class);
        verify(transactions).save(saved.capture());
        assertThat(saved.getValue().getType()).isEqualTo("points_expired");
        assertThat(saved.getValue().getAmount()).isEqualTo(-100);
        assertThat(saved.getValue().getStatus()).isEqualTo(1);
        verify(jdbc).update("UPDATE point_lots SET points_remaining = 0 WHERE id = ?", 1L);
        verify(jdbc, never()).update("UPDATE point_lots SET points_remaining = 0 WHERE id = ?", 2L);
    }

    @Test
    void theTransactionOnlyRecordsWhatTheBalanceHad() {
        when(ledger.open(7L)).thenReturn(List.of(new Lot(1, 100, LocalDate.of(2026, 11, 1))));
        when(wallet.expireWalletC(7L, 100)).thenReturn(60L);

        on(LocalDate.of(2028, 1, 1)).expireDue();

        ArgumentCaptor<Transaction> saved = ArgumentCaptor.forClass(Transaction.class);
        verify(transactions).save(saved.capture());
        assertThat(saved.getValue().getAmount()).isEqualTo(-60);
    }

    @Test
    void aMemberWithNoDueLotLosesNothing() {
        when(ledger.open(7L)).thenReturn(List.of(new Lot(2, 40, LocalDate.of(2027, 6, 1))));
        assertThat(on(LocalDate.of(2028, 1, 1)).expireDue()).isZero();
        verify(wallet, never()).expireWalletC(anyLong(), anyLong());
    }

    @Test
    void reminderIsSentOncePerStep() {
        when(ledger.open(7L)).thenReturn(List.of(new Lot(1, 100, LocalDate.of(2026, 11, 1))));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        // 2027-12-02 is 30 days before 2028-01-01.
        assertThat(on(LocalDate.of(2027, 12, 2)).remindUpcoming()).isEqualTo(1);
        verify(notifications).createNotification(eq(7L), eq("points_expiring"), anyString(), anyString(), eq("/account/anypoint"));
    }

    @Test
    void reminderIsNotRepeatedWhenAlreadyClaimed() {
        when(ledger.open(7L)).thenReturn(List.of(new Lot(1, 100, LocalDate.of(2026, 11, 1))));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);

        assertThat(on(LocalDate.of(2027, 12, 2)).remindUpcoming()).isZero();
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void noReminderWhenFarAway() {
        when(ledger.open(7L)).thenReturn(List.of(new Lot(1, 100, LocalDate.of(2026, 11, 1))));
        assertThat(on(LocalDate.of(2027, 6, 1)).remindUpcoming()).isZero();
    }
}
