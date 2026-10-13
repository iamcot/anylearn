package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.PackageView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PackageCards {

    private static final int RENEW_WHEN_REMAINING_AT_MOST = 3;
    private static final int DAYS_TO_KEEP_FINISHED = 30;

    private final SessionSchedule schedule;

    public record Progress(int used, int total) {
        public int remaining() {
            return Math.max(total - used, 0);
        }
    }

    public List<PackageView> build(List<EnrollmentContext> contexts, LocalDateTime now) {
        return contexts.stream()
                .filter(context -> context.hasSchedule() && !context.isFee())
                .map(context -> viewOf(context, now))
                .filter(view -> isVisible(view.remaining(), view.endDate(), now.toLocalDate()))
                .toList();
    }

    public Progress progressOf(List<Session> sessions, Integer purchasedSessions, LocalDateTime now) {
        int total = purchasedSessions != null ? purchasedSessions : sessions.size();
        int ended = (int) sessions.stream().filter(session -> session.hasEndedBy(now)).count();
        return new Progress(Math.min(ended, total), total);
    }

    public boolean shouldShowRenew(int remainingSessions) {
        return remainingSessions <= RENEW_WHEN_REMAINING_AT_MOST;
    }

    public boolean isVisible(int remainingSessions, LocalDate endDate, LocalDate today) {
        if (remainingSessions > 0 || endDate == null) return true;
        return !endDate.plusDays(DAYS_TO_KEEP_FINISHED).isBefore(today);
    }

    private PackageView viewOf(EnrollmentContext context, LocalDateTime now) {
        Progress progress = progressOf(schedule.wholePeriod(context), context.purchasedSessions(), now);
        boolean showRenew = context.isSessionBased() && shouldShowRenew(progress.remaining());
        return new PackageView(context.enrollment().getId(), context.item().getId(), context.item().getTitle(),
                progress.used(), progress.total(), progress.remaining(),
                schedule.periodOf(context).to(), showRenew);
    }
}
