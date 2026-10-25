package com.anylearn.backend.service.payment.bank;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Bank account that receives bank transfers. Admins edit it in the back office (stored in the
 * configurations table); a field that was never saved falls back to the BANK_* environment values.
 */
@Service
@RequiredArgsConstructor
public class BankAccountService {

    public record BankAccount(String bankName, String bankBin, String accountNumber, String accountName, String zaloPhone) {}

    static final String KEY_PREFIX = "bank/";
    static final String CONFIG_TYPE = "bank";
    private static final Pattern BIN = Pattern.compile("\\d{6}");
    private static final Pattern ACCOUNT_NUMBER = Pattern.compile("[0-9A-Za-z]{4,19}");

    private final ConfigurationRepository configurationRepository;
    private final PaymentConfig paymentConfig;

    public BankAccount current() {
        PaymentConfig.BankTransferProps env = paymentConfig.getBankTransfer();
        return new BankAccount(
                stored("bankName", env.getBankName()),
                stored("bankBin", env.getBankBin()),
                stored("accountNumber", env.getAccountNumber()),
                stored("accountName", env.getAccountName()),
                stored("zaloPhone", env.getZaloPhone()));
    }

    /** Returns null when saved, otherwise the reason it was refused. */
    @Transactional
    public String save(BankAccount account) {
        BankAccount cleaned = clean(account);
        String problem = validate(cleaned);
        if (problem != null) return problem;
        put("bankName", cleaned.bankName());
        put("bankBin", cleaned.bankBin());
        put("accountNumber", cleaned.accountNumber());
        put("accountName", cleaned.accountName());
        put("zaloPhone", cleaned.zaloPhone());
        return null;
    }

    static BankAccount clean(BankAccount account) {
        return new BankAccount(trim(account.bankName()), trim(account.bankBin()),
                trim(account.accountNumber()).replaceAll("\\s", ""), trim(account.accountName()), trim(account.zaloPhone()));
    }

    static String validate(BankAccount account) {
        if (account.bankName().isEmpty()) return "Vui lòng chọn ngân hàng";
        if (!BIN.matcher(account.bankBin()).matches()) return "Mã BIN ngân hàng gồm 6 chữ số";
        if (!ACCOUNT_NUMBER.matcher(account.accountNumber()).matches()) return "Số tài khoản gồm 4 đến 19 chữ hoặc số";
        if (account.accountName().isEmpty()) return "Vui lòng nhập tên chủ tài khoản";
        return null;
    }

    private String stored(String field, String fallback) {
        Optional<Configuration> row = configurationRepository.findByKey(KEY_PREFIX + field);
        return row.map(Configuration::getValue).filter(value -> !value.isBlank()).orElse(fallback == null ? "" : fallback);
    }

    private void put(String field, String value) {
        String key = KEY_PREFIX + field;
        Configuration row = configurationRepository.findByKey(key).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(key);
            created.setType(CONFIG_TYPE);
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(value);
        row.setUpdatedAt(LocalDateTime.now());
        configurationRepository.save(row);
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
