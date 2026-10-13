package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.FeeView;
import com.anylearn.backend.entity.Item;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class FeeCards {

    private static final int DUE_SOON_DAYS = 7;
    private static final String NO_PERIOD_LABEL = "Kỳ học phí";

    public List<FeeView> build(LearnerData data, LocalDate today) {
        List<EnrollmentContext> feeContexts = data.contexts().stream().filter(EnrollmentContext::isFee).toList();
        Map<Long, List<EnrollmentContext>> paidByItem = feeContexts.stream()
                .collect(Collectors.groupingBy(context -> context.item().getId()));
        Set<Long> pendingIds = data.pendingFeeItems().stream().map(Item::getId).collect(Collectors.toSet());

        return feeItemsOf(feeContexts, data.pendingFeeItems()).stream()
                .map(item -> viewOf(item, paidByItem.getOrDefault(item.getId(), List.of()),
                        pendingIds.contains(item.getId()), today))
                .filter(view -> view.state() != FeeCardState.HIDDEN)
                .sorted(Comparator.comparing(FeeView::itemId))
                .toList();
    }

    public FeeCardState stateOf(LocalDate paidUntil, boolean hasPendingPayment, LocalDate today) {
        if (hasPendingPayment) return FeeCardState.AWAITING_CONFIRMATION;
        if (paidUntil == null) return FeeCardState.HIDDEN;
        if (today.isAfter(paidUntil)) return FeeCardState.OVERDUE;
        return ChronoUnit.DAYS.between(today, paidUntil) <= DUE_SOON_DAYS ? FeeCardState.DUE_SOON : FeeCardState.HIDDEN;
    }

    public LocalDate periodEnd(LocalDate start, String cycleType, Integer cycleAmount) {
        int amount = cycleAmount != null && cycleAmount > 0 ? cycleAmount : 1;
        return switch (cycleType == null ? "month" : cycleType) {
            case "year" -> start.plusYears(amount).minusDays(1);
            case "week" -> start.plusWeeks(amount).minusDays(1);
            case "day" -> start.plusDays(amount).minusDays(1);
            default -> start.plusMonths(amount).minusDays(1);
        };
    }

    public Optional<LocalDate> paidUntil(Collection<LocalDate> periodEnds) {
        return periodEnds.stream().filter(Objects::nonNull).max(LocalDate::compareTo);
    }

    public String paidUntilText(LocalDate paidUntil) {
        boolean endsOnMonthEnd = paidUntil.equals(paidUntil.withDayOfMonth(paidUntil.lengthOfMonth()));
        return endsOnMonthEnd
                ? "hết tháng " + paidUntil.getMonthValue()
                : "hết ngày %02d/%02d".formatted(paidUntil.getDayOfMonth(), paidUntil.getMonthValue());
    }

    public String paidPeriodLabel(String itemTitle, LocalDate start, String cycleType, Integer cycleAmount) {
        if (itemTitle != null && !itemTitle.isBlank()) return itemTitle.trim();
        return periodLabel(start, cycleType, cycleAmount);
    }

    public String periodLabel(LocalDate start, String cycleType, Integer cycleAmount) {
        if (start == null || cycleType == null) return NO_PERIOD_LABEL;
        int amount = cycleAmount != null && cycleAmount > 0 ? cycleAmount : 1;
        return switch (cycleType) {
            case "month" -> monthLabel(start, amount);
            case "year" -> "Năm học " + start.getYear();
            default -> NO_PERIOD_LABEL;
        };
    }

    private Collection<Item> feeItemsOf(List<EnrollmentContext> feeContexts, List<Item> pendingItems) {
        Map<Long, Item> byId = new LinkedHashMap<>();
        feeContexts.forEach(context -> byId.put(context.item().getId(), context.item()));
        pendingItems.forEach(item -> byId.putIfAbsent(item.getId(), item));
        return byId.values();
    }

    private FeeView viewOf(Item item, List<EnrollmentContext> paid, boolean hasPending, LocalDate today) {
        Optional<LocalDate> paidUntil = paidUntil(paid.stream().map(c -> c.enrollment().getEndDate()).toList());
        LocalDate nextStart = paidUntil.map(date -> date.plusDays(1)).orElse(null);
        return new FeeView(item.getId(), item.getTitle(),
                stateOf(paidUntil.orElse(null), hasPending, today),
                paidUntil.orElse(null),
                paidUntil.map(this::paidUntilText).orElse(null),
                paidUntil.map(date -> lastPaidPeriodLabel(item, paid)).orElse(null),
                nextStart,
                periodLabel(nextStart, item.getCycleType(), item.getCycleAmount()),
                item.getPrice());
    }

    private String lastPaidPeriodLabel(Item item, List<EnrollmentContext> paid) {
        LocalDate lastStart = paid.stream()
                .filter(context -> context.enrollment().getEndDate() != null)
                .max(Comparator.comparing(context -> context.enrollment().getEndDate()))
                .map(context -> context.enrollment().getStartDate())
                .orElse(null);
        return paidPeriodLabel(item.getTitle(), lastStart, item.getCycleType(), item.getCycleAmount());
    }

    private String monthLabel(LocalDate start, int months) {
        if (months == 1) return "Tháng " + start.getMonthValue();
        LocalDate last = start.plusMonths(months - 1L);
        return "Tháng %d–%d".formatted(start.getMonthValue(), last.getMonthValue());
    }
}
