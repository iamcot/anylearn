package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.Item;

import java.util.List;

public record LearnerData(List<EnrollmentContext> contexts, List<Item> pendingFeeItems) {
}
