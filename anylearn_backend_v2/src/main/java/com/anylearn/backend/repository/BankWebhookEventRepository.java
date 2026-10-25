package com.anylearn.backend.repository;

import com.anylearn.backend.entity.BankWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BankWebhookEventRepository extends JpaRepository<BankWebhookEvent, Long> {

    boolean existsByProviderAndProviderTxnId(String provider, String providerTxnId);
}
