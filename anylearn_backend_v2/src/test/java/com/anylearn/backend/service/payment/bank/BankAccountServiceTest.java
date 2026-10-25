package com.anylearn.backend.service.payment.bank;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.payment.bank.BankAccountService.BankAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BankAccountServiceTest {

    private ConfigurationRepository repository;
    private PaymentConfig paymentConfig;
    private BankAccountService service;

    @BeforeEach
    void setUp() {
        repository = mock(ConfigurationRepository.class);
        paymentConfig = new PaymentConfig();
        paymentConfig.getBankTransfer().setAccountNumber("111122223333");
        paymentConfig.getBankTransfer().setAccountName("ENV NAME");
        service = new BankAccountService(repository, paymentConfig);
    }

    private BankAccount acb() {
        return new BankAccount("ACB", "970416", "0123 4567 89", " CONG TY CP ANYLEARN ", "0374900344");
    }

    private void store(String field, String value) {
        Configuration row = new Configuration();
        row.setKey("bank/" + field);
        row.setValue(value);
        when(repository.findByKey("bank/" + field)).thenReturn(Optional.of(row));
    }

    @Test
    void usesEnvironmentValuesUntilAnAdminSavesAnAccount() {
        BankAccount account = service.current();

        assertThat(account.accountNumber()).isEqualTo("111122223333");
        assertThat(account.accountName()).isEqualTo("ENV NAME");
        assertThat(account.bankBin()).isEqualTo("970422");
    }

    @Test
    void savedValuesOverrideTheEnvironment() {
        store("accountNumber", "0123456789");
        store("bankBin", "970416");
        store("accountName", "   ");

        BankAccount account = service.current();

        assertThat(account.accountNumber()).isEqualTo("0123456789");
        assertThat(account.bankBin()).isEqualTo("970416");
        assertThat(account.accountName()).as("blank saved value falls back").isEqualTo("ENV NAME");
    }

    @Test
    void savesCleanedValuesUnderBankKeys() {
        when(repository.findByKey(anyString())).thenReturn(Optional.empty());

        assertThat(service.save(acb())).isNull();

        ArgumentCaptor<Configuration> rows = ArgumentCaptor.forClass(Configuration.class);
        verify(repository, org.mockito.Mockito.times(5)).save(rows.capture());
        List<Configuration> saved = rows.getAllValues();
        assertThat(saved).extracting(Configuration::getKey)
                .containsExactly("bank/bankName", "bank/bankBin", "bank/accountNumber", "bank/accountName", "bank/zaloPhone");
        assertThat(saved).extracting(Configuration::getValue)
                .containsExactly("ACB", "970416", "0123456789", "CONG TY CP ANYLEARN", "0374900344");
        assertThat(saved).extracting(Configuration::getType).containsOnly("bank");
    }

    @Test
    void refusesInvalidAccountsWithoutSavingAnything() {
        assertThat(service.save(new BankAccount("", "970416", "0123456789", "A", ""))).contains("ngân hàng");
        assertThat(service.save(new BankAccount("ACB", "9704", "0123456789", "A", ""))).contains("BIN");
        assertThat(service.save(new BankAccount("ACB", "970416", "12", "A", ""))).contains("tài khoản");
        assertThat(service.save(new BankAccount("ACB", "970416", "0123456789", " ", ""))).contains("chủ tài khoản");
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
