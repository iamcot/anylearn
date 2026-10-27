package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.PackageView;
import com.anylearn.backend.service.lifecycle.LifecycleSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PackageCards {

    private static final int DEFAULT_RENEW_WHEN_REMAINING_AT_MOST = LifecycleSettings.DEFAULT_RENEW_SESSIONS_LEFT;
    private static final int DAYS_TO_KEEP_FINISHED = 30;

    private final SessionSchedule schedule;

    // Editable in the back office (plan 07.5); absent in unit tests, then the default applies.
    @Autowired(required = false)
    private LifecycleSettings settings;

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
        return remainingSessions <= (settings == null ? DEFAULT_RENEW_WHEN_REMAINING_AT_MOST : settings.renewSessionsLeft());
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
