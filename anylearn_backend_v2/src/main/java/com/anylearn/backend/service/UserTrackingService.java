package com.anylearn.backend.service;

import com.anylearn.backend.entity.UserEvent;
import com.anylearn.backend.repository.UserEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserTrackingService {

    private final UserEventRepository userEventRepository;

    @Async
    public void recordView(Long profileUserId, Long visitorId) {
        if (profileUserId == null) return;
        // Deduplicate: same visitor viewing same profile within 10 minutes → skip
        if (visitorId != null) {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            if (userEventRepository.existsByUserIdAndVisitorIdAndTypeAndCreatedAtAfter(
                    profileUserId, visitorId, "view", tenMinutesAgo)) {
                return;
            }
        }
        userEventRepository.save(new UserEvent(profileUserId, visitorId, "view"));
    }
}
