package com.anylearn.backend.service.search;

import com.anylearn.backend.entity.Item;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Which search attributes a course lacks, so the team can fill them: a course missing one is found less often. */
public final class ItemAttributeGaps {

    public static final Map<String, String> LABELS = new LinkedHashMap<>();
    static {
        LABELS.put("ages", "Độ tuổi");
        LABELS.put("category", "Lĩnh vực");
        LABELS.put("tags", "Tags");
        LABELS.put("location", "Địa điểm có toạ độ");
        LABELS.put("schedule", "Lịch học có giờ");
        LABELS.put("sessions", "Số buổi (kiểu và số lượng chu kỳ)");
        LABELS.put("partnerType", "Loại đối tác");
    }

    private static final Set<String> NEEDS_PLACE = Set.of("offline", "extra", "preschool");
    private static final Set<String> NEEDS_NO_SCHEDULE = Set.of("digital", "video");

    /** What is known about the course; counts come from the database. */
    public record Facts(int categories, int tags, int schedulesWithTime, int branchesWithCoordinates, boolean partnerTypeKnown, boolean placeExempt) {}

    private ItemAttributeGaps() {}

    public static List<String> of(Item item, Facts facts) {
        List<String> gaps = new ArrayList<>();
        if (item.getAgesMin() == null && item.getAgesMax() == null) gaps.add("ages");
        if (facts.categories() == 0) gaps.add("category");
        if (facts.tags() == 0) gaps.add("tags");
        String format = item.getSubtype();
        if (!facts.placeExempt() && format != null && NEEDS_PLACE.contains(format) && facts.branchesWithCoordinates() == 0) gaps.add("location");
        // A fee-collection item still has a place, but no classes or sessions to describe.
        if (item.getIsPaymentfee() != null && item.getIsPaymentfee() == 1) {
            if (!facts.partnerTypeKnown()) gaps.add("partnerType");
            return gaps;
        }
        if (!NEEDS_NO_SCHEDULE.contains(format == null ? "" : format) && facts.schedulesWithTime() == 0) gaps.add("schedule");
        if (!NEEDS_NO_SCHEDULE.contains(format == null ? "" : format)
                && (item.getCycleType() == null || item.getCycleAmount() == null || item.getCycleAmount() <= 0)) gaps.add("sessions");
        if (!facts.partnerTypeKnown()) gaps.add("partnerType");
        return gaps;
    }
}
