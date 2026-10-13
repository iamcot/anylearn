package com.anylearn.backend.dto.today;

import java.util.List;

public record LearnersResponse(List<LearnerView> learners, Long defaultLearnerId, int feeDueTotal) {
}
