package com.anylearn.backend.dto.today;

import com.anylearn.backend.service.today.FeeCardState;

import java.time.LocalDate;

public record FeeView(Long itemId, String itemTitle, FeeCardState state,
                      LocalDate paidUntil, String paidUntilText, String paidPeriodLabel,
                      LocalDate nextStart, String nextPeriodLabel, Long amount) {
}
