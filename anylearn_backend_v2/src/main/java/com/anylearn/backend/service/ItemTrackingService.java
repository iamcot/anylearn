package com.anylearn.backend.service;

import com.anylearn.backend.entity.ItemEvent;
import com.anylearn.backend.repository.ItemEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ItemTrackingService {

    private final ItemEventRepository itemEventRepository;

    @Async
    public void record(Long itemId, Long userId, String type) {
        if (itemId == null) return;
        // Deduplicate: skip if same user+item+type recorded in last 10 minutes
        if (userId != null) {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            if (itemEventRepository.existsByItemIdAndUserIdAndTypeAndCreatedAtAfter(
                    itemId, userId, type, tenMinutesAgo)) {
                return;
            }
        }
        itemEventRepository.save(new ItemEvent(itemId, userId, type));
    }
}
