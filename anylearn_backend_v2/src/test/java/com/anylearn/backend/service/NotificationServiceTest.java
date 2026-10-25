package com.anylearn.backend.service;

import com.anylearn.backend.repository.NotificationRepository;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class NotificationServiceTest {

    private NotificationSseService sseService;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        sseService = mock(NotificationSseService.class);
        service = new NotificationService(mock(NotificationRepository.class), sseService,
                mock(EmailService.class), mock(UserRepository.class));
    }

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.clearSynchronization();
    }

    @Test
    void pushesRightAwayOutsideATransaction() {
        service.pushToBrowser(7L);

        verify(sseService).notifyUser(7L);
    }

    @Test
    void waitsForTheCommitInsideATransaction() {
        TransactionSynchronizationManager.initSynchronization();

        service.pushToBrowser(7L);
        verify(sseService, never()).notifyUser(7L);

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(sseService).notifyUser(7L);
    }

    @Test
    void neverPushesWhenTheTransactionRollsBack() {
        TransactionSynchronizationManager.initSynchronization();

        service.pushToBrowser(7L);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verify(sseService, never()).notifyUser(7L);
    }
}
