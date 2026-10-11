package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ItemSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemScheduleRepository extends JpaRepository<ItemSchedule, Long> {
    List<ItemSchedule> findByItemIdAndStatus(Long itemId, Byte status);
}
