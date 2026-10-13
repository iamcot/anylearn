package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ScheduleRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScheduleRequestRepository extends JpaRepository<ScheduleRequest, Long> {

    List<ScheduleRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<ScheduleRequest> findAllByOrderByCreatedAtDesc();

    List<ScheduleRequest> findByLearnerIdAndStatus(Long learnerId, String status);

    List<ScheduleRequest> findByLearnerIdAndTypeAndStatus(Long learnerId, String type, String status);

    boolean existsByLearnerIdAndItemScheduleIdAndSessionDateAndStatus(
            Long learnerId, Long itemScheduleId, java.time.LocalDate sessionDate, String status);
}
