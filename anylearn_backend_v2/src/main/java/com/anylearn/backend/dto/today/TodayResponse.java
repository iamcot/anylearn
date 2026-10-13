package com.anylearn.backend.dto.today;

import com.anylearn.backend.service.today.Learner;

import java.util.List;

public record TodayResponse(Learner learner, SessionView nextSession, boolean freeToday,
                            List<SessionView> laterToday, List<SessionView> extraSessions,
                            List<FeeView> fees, List<WeekDayView> week, List<PackageView> packages) {
}
