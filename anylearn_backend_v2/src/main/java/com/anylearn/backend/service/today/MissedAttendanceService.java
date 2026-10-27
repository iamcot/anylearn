package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Sessions that already ended in the last {@value #WINDOW_DAYS} days with no attendance and no approved leave: the "forgot to mark" list. */
@Service
@RequiredArgsConstructor
public class MissedAttendanceService {

    static final int WINDOW_DAYS = 30;

    private final LearnerLoader loader;
    private final SessionSchedule schedule;
    private final SessionAttendanceRepository attendances;
    private final ScheduleRequestRepository requests;
    private final Clock clock;

    /** Newest first: `total` is the whole count, `items` the first `limit`. */
    public Map<String, Object> missed(User account, Long learnerId, int limit) {
        Learner learner = loader.require(account, learnerId);
        LocalDateTime now = LocalDateTime.now(clock);
        DateRange window = DateRange.of(now.toLocalDate().minusDays(WINDOW_DAYS), now.toLocalDate());
        Map<String, Map<String, Object>> byKey = new LinkedHashMap<>(); // a class enrolled twice lists a session once
        for (EnrollmentContext context : loader.load(learner.id()).contexts()) {
            if (!context.hasSchedule() || context.isFee()) continue;
            Long scheduleId = context.schedule().getId();
            for (Session session : schedule.sessionsIn(context, window)) {
                if (!session.hasEndedBy(now) || covered(learner.id(), scheduleId, session.date())) continue;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("sessionKey", session.key().toString());
                row.put("learnerId", learner.id());
                row.put("itemTitle", context.item().getTitle());
                row.put("date", session.date().toString());
                row.put("start", session.start() == null ? null : session.start().toString());
                byKey.putIfAbsent(session.key().toString(), row);
            }
        }
        List<Map<String, Object>> rows = new ArrayList<>(byKey.values());
        rows.sort(Comparator.comparing((Map<String, Object> row) -> String.valueOf(row.get("date")))
                .thenComparing(row -> String.valueOf(row.get("start"))).reversed());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", rows.size());
        result.put("items", rows.stream().limit(Math.max(1, limit)).toList());
        return result;
    }

    private boolean covered(Long learnerId, Long scheduleId, LocalDate date) {
        return attendances.findByLearnerIdAndItemScheduleIdAndSessionDate(learnerId, scheduleId, date).isPresent()
                || requests.existsByLearnerIdAndItemScheduleIdAndSessionDateAndStatus(learnerId, scheduleId, date, ScheduleRequest.STATUS_APPROVED);
    }
}
