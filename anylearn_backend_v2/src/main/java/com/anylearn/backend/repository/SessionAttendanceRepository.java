package com.anylearn.backend.repository;

import com.anylearn.backend.entity.SessionAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SessionAttendanceRepository extends JpaRepository<SessionAttendance, Long> {

    Optional<SessionAttendance> findByLearnerIdAndItemScheduleIdAndSessionDate(
            Long learnerId, Long itemScheduleId, LocalDate sessionDate);

    List<SessionAttendance> findByLearnerIdAndSessionDateBetween(Long learnerId, LocalDate from, LocalDate to);

    List<SessionAttendance> findBySessionDateBetween(LocalDate from, LocalDate to);
}
