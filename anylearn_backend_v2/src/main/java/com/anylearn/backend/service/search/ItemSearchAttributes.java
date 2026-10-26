package com.anylearn.backend.service.search;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.UserLocation;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/** Values the search index derives from a course, its schedules and its branches. Nothing here is stored twice. */
public record ItemSearchAttributes(
        List<String> timeSlots, Integer nextStartDay, Long pricePerSession, boolean onSale, boolean hasFreeTrial,
        Map<String, Double> geo, List<Map<String, Object>> locations, List<String> districtCodes) {

    public static ItemSearchAttributes derive(Item item, List<ItemSchedule> schedules, List<UserLocation> branches, LocalDate today) {
        List<TimeSlots.ScheduleSlot> slots = schedules.stream()
                .map(s -> new TimeSlots.ScheduleSlot(s.getWeekdays(), s.getTimeStart(), s.getEventDate())).toList();
        Integer sessions = SessionCounts.estimate(item.getCycleType(), item.getCycleAmount(), weekdaysPerWeek(schedules));
        List<UserLocation> located = branches.stream().filter(b -> b.getLat() != null && b.getLng() != null).toList();
        Optional<UserLocation> primary = primaryBranch(item, located);
        return new ItemSearchAttributes(
                TimeSlots.of(slots),
                nextStartDay(schedules, item.getDateStart(), today),
                SessionCounts.pricePerSession(item.getPrice(), sessions),
                item.getOrgPrice() != null && item.getPrice() != null && item.getOrgPrice() > item.getPrice(),
                item.getActiviyTrial() != null && item.getActiviyTrial() == 1,
                primary.map(b -> Map.of("lat", b.getLat().doubleValue(), "lng", b.getLng().doubleValue())).orElse(null),
                located.stream().map(ItemSearchAttributes::branchView).toList(),
                branches.stream().map(UserLocation::getDistrictCode).filter(Objects::nonNull).distinct().toList());
    }

    /** The branch the course points at by default, else the first one with coordinates. */
    static Optional<UserLocation> primaryBranch(Item item, List<UserLocation> located) {
        return located.stream().filter(b -> b.getId().equals(item.getUserLocationId())).findFirst()
                .or(() -> located.stream().findFirst());
    }

    static int weekdaysPerWeek(List<ItemSchedule> schedules) {
        return schedules.stream().mapToInt(s -> s.getWeekdays() == null || s.getWeekdays().isBlank()
                ? 0 : s.getWeekdays().split(",").length).max().orElse(0);
    }

    /** Epoch day of the soonest start still open: a running class counts as starting today. Null when nothing is upcoming. */
    static Integer nextStartDay(List<ItemSchedule> schedules, LocalDate itemStart, LocalDate today) {
        Set<LocalDate> starts = new LinkedHashSet<>();
        for (ItemSchedule s : schedules) {
            if (s.getEventDate() != null) {
                if (!s.getEventDate().isBefore(today)) starts.add(s.getEventDate());
            } else if (s.getDateStart() != null) {
                boolean ended = s.getDateEnd() != null && s.getDateEnd().isBefore(today);
                if (!ended) starts.add(s.getDateStart().isBefore(today) ? today : s.getDateStart());
            } else if ("open".equals(s.getScheduleType()) || "recurring".equals(s.getScheduleType())) {
                boolean ended = s.getDateEnd() != null && s.getDateEnd().isBefore(today);
                if (!ended) starts.add(today);
            }
        }
        if (starts.isEmpty() && itemStart != null && !itemStart.isBefore(today)) starts.add(itemStart);
        return starts.stream().min(LocalDate::compareTo).map(d -> (int) d.toEpochDay()).orElse(null);
    }

    private static Map<String, Object> branchView(UserLocation b) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("title", b.getTitle());
        view.put("lat", b.getLat().doubleValue());
        view.put("lng", b.getLng().doubleValue());
        view.put("districtCode", b.getDistrictCode());
        return view;
    }

    public static List<UserLocation> activeBranchesOf(Item item, List<ItemSchedule> schedules, java.util.function.Function<List<Long>, List<UserLocation>> load) {
        List<Long> ids = new ArrayList<>();
        if (item.getUserLocationId() != null) ids.add(item.getUserLocationId());
        schedules.stream().map(ItemSchedule::getUserLocationId).filter(Objects::nonNull).filter(id -> !ids.contains(id)).forEach(ids::add);
        return ids.isEmpty() ? List.of() : load.apply(ids).stream().filter(b -> b.getStatus() != null && b.getStatus() == 1).toList();
    }
}
