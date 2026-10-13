package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.FeeView;
import com.anylearn.backend.dto.today.LearnerView;
import com.anylearn.backend.dto.today.LearnersResponse;
import com.anylearn.backend.dto.today.SessionView;
import com.anylearn.backend.dto.today.TodayResponse;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TodayService {

    private static final int LOOKAHEAD_DAYS = 60;

    private final LearnerLoader loader;
    private final SessionSchedule schedule;
    private final SessionViews sessionViews;
    private final ScheduleRequestRepository requests;
    private final FeeCards feeCards;
    private final PackageCards packageCards;
    private final Clock clock;

    public LearnersResponse learners(User account) {
        LocalDate today = LocalDate.now(clock);
        List<LearnerView> views = loader.learnersOf(account).stream()
                .map(learner -> learnerViewOf(learner, today))
                .toList();
        return new LearnersResponse(views, defaultLearnerId(views), totalFeeDue(views));
    }

    public TodayResponse today(User account, Long learnerId) {
        Learner learner = resolveLearner(account, learnerId);
        LearnerData data = loader.load(learner.id());
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        DateRange window = DateRange.of(weekStart, today.plusDays(LOOKAHEAD_DAYS));

        Set<String> leaveKeys = approvedLeaveKeys(learner.id());
        List<Session> classSessions = sessionsOf(data, window, false, leaveKeys);
        List<Session> extraSessions = sessionsOf(data, window, true, leaveKeys);
        SessionViewBuilder views = sessionViews.builderFor(data.contexts(), learner.id(), window, now);

        Optional<Session> next = schedule.pickNext(classSessions, now);
        boolean freeToday = next.map(session -> !session.date().equals(today)).orElse(true);

        return new TodayResponse(
                learner,
                next.map(views::of).orElse(null),
                freeToday,
                laterToday(classSessions, next, today).stream().map(views::of).toList(),
                schedule.visibleExtra(extraSessions, now).stream().map(views::of).toList(),
                feeCards.build(data, today),
                sessionViews.weekStrip(weekStart, allSessions(classSessions, extraSessions), views),
                packageCards.build(data.contexts(), now));
    }

    private Learner resolveLearner(User account, Long learnerId) {
        Long id = learnerId != null ? learnerId : learners(account).defaultLearnerId();
        return loader.require(account, id);
    }

    private LearnerView learnerViewOf(Learner learner, LocalDate today) {
        LearnerData data = loader.load(learner.id());
        int feeDue = (int) feeCards.build(data, today).stream()
                .map(FeeView::state).filter(FeeCardState::needsPayment).count();
        return new LearnerView(learner.id(), learner.name(), learner.self(), !data.contexts().isEmpty(), feeDue);
    }

    private Long defaultLearnerId(List<LearnerView> views) {
        return views.stream().filter(LearnerView::hasEnrollment).findFirst()
                .orElse(views.get(0)).id();
    }

    private int totalFeeDue(List<LearnerView> views) {
        return views.stream().mapToInt(LearnerView::feeDueCount).sum();
    }

    private List<Session> sessionsOf(LearnerData data, DateRange window, boolean extra, Set<String> leaveKeys) {
        return data.contexts().stream()
                .filter(context -> !context.isFee() && (context.mode() == SessionMode.EXTRA) == extra)
                .flatMap(context -> schedule.sessionsIn(context, window).stream())
                .filter(session -> !leaveKeys.contains(session.key().toString()))
                .toList();
    }

    private Set<String> approvedLeaveKeys(Long learnerId) {
        return requests.findByLearnerIdAndTypeAndStatus(learnerId, ScheduleRequest.TYPE_LEAVE, ScheduleRequest.STATUS_APPROVED)
                .stream()
                .map(request -> new SessionKey(request.getItemScheduleId(), request.getSessionDate()).toString())
                .collect(Collectors.toSet());
    }

    private List<Session> laterToday(List<Session> classSessions, Optional<Session> next, LocalDate today) {
        return next.filter(session -> session.date().equals(today))
                .map(session -> schedule.laterOnSameDay(classSessions, session))
                .orElse(List.of());
    }

    private List<Session> allSessions(List<Session> classSessions, List<Session> extraSessions) {
        return Stream.concat(classSessions.stream(), extraSessions.stream()).toList();
    }
}
