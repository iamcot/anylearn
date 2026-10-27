package com.anylearn.backend.service.recommend;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/** Pure rules of the suggestion engine (plan 08): who may be suggested what, what ranks first, what counts as free time. */
public final class RecommendationRules {

    public static final String PATHWAY = "pathway";
    public static final String SIBLING = "sibling";
    public static final String FREE_SLOT = "free_slot";
    public static final String SEASON = "season";
    public static final String INTEREST = "interest";
    public static final List<String> SOURCES = List.of(PATHWAY, SIBLING, FREE_SLOT, SEASON, INTEREST);

    public static final int DEFAULT_DISMISS_DAYS = 30;

    private RecommendationRules() {}

    /** A weekly slot of a class. Missing times mean "unknown": such a slot never conflicts with another one. */
    public record Slot(DayOfWeek day, LocalTime start, LocalTime end) {}

    /** One suggestion. `options` holds the weekly slots of each class of the course (empty = no class times, e.g. online video). */
    public record Candidate(Long itemId, String source, String reasonCode, String reasonText, int score,
                            Integer agesMin, Integer agesMax, List<List<Slot>> options) {
        public Candidate withOptions(List<List<Slot>> newOptions) {
            return new Candidate(itemId, source, reasonCode, reasonText, score, agesMin, agesMax, newOptions);
        }
    }

    public static int baseScore(String source) {
        return switch (source) {
            case PATHWAY -> 100;
            case SIBLING -> 70;
            case FREE_SLOT -> 50;
            case SEASON -> 40;
            default -> 30;
        };
    }

    /** "pathway,season" -> the known sources in that text; blank or null means every source. */
    public static List<String> parseSources(String text) {
        if (text == null || text.isBlank()) return SOURCES;
        List<String> found = new ArrayList<>();
        for (String part : text.split("[,;\\s]+")) {
            if (SOURCES.contains(part) && !found.contains(part)) found.add(part);
        }
        return found;
    }

    /** True when two weekly slots are on the same day and their times overlap (touching end/start is not an overlap). */
    public static boolean overlaps(Slot a, Slot b) {
        if (a.day() != b.day() || a.start() == null || a.end() == null || b.start() == null || b.end() == null) return false;
        return a.start().isBefore(b.end()) && b.start().isBefore(a.end());
    }

    public static boolean conflicts(List<Slot> candidate, List<Slot> busy) {
        for (Slot slot : candidate) {
            for (Slot taken : busy) {
                if (overlaps(slot, taken)) return true;
            }
        }
        return false;
    }

    /** The classes of a course that fit the learner's week. A course with no class times always fits. */
    public static List<List<Slot>> fittingOptions(List<List<Slot>> options, List<Slot> busy) {
        if (options.isEmpty()) return options;
        return options.stream().filter(option -> !conflicts(option, busy)).toList();
    }

    /** Days of the week with no class at all (unknown times count as busy, so a day is only free when it is really empty). */
    public static List<DayOfWeek> freeDays(List<Slot> busy) {
        Set<DayOfWeek> taken = new HashSet<>();
        busy.forEach(slot -> taken.add(slot.day()));
        List<DayOfWeek> free = new ArrayList<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            if (!taken.contains(day)) free.add(day);
        }
        return free;
    }

    /** Age check with the bounds of a learner (youngest, oldest); unknown age (null) lets everything through. */
    public static boolean ageFits(int[] bounds, Integer min, Integer max) {
        if (bounds == null) return true;
        if (min != null && bounds[1] < min) return false;
        return max == null || bounds[0] <= max;
    }

    /**
     * The common filter of every source: not owned, not dismissed, fits the age, and at least one class fits the week.
     * Returns the candidate narrowed to the classes that fit, or empty.
     */
    public static Optional<Candidate> eligible(Candidate candidate, int[] ageBounds, Set<Long> owned, Set<Long> dismissed, List<Slot> busy) {
        if (owned.contains(candidate.itemId()) || dismissed.contains(candidate.itemId())) return Optional.empty();
        if (!ageFits(ageBounds, candidate.agesMin(), candidate.agesMax())) return Optional.empty();
        List<List<Slot>> fitting = fittingOptions(candidate.options(), busy);
        if (!candidate.options().isEmpty() && fitting.isEmpty()) return Optional.empty();
        return Optional.of(candidate.withOptions(fitting));
    }

    /** A pathway step holds one or more courses (alternatives): the learner has the step when they have any of them. */
    public static boolean hasStep(List<Long> step, Set<Long> owned) {
        return step.stream().anyMatch(owned::contains);
    }

    /** How many steps of the pathway the learner has. */
    public static int doneSteps(List<List<Long>> steps, Set<Long> owned) {
        return (int) steps.stream().filter(step -> hasStep(step, owned)).count();
    }

    /** Index of the last step the learner has, -1 when none. */
    public static int highestDone(List<List<Long>> steps, Set<Long> owned) {
        for (int i = steps.size() - 1; i >= 0; i--) {
            if (hasStep(steps.get(i), owned)) return i;
        }
        return -1;
    }

    /** Steps before the last one the learner has that they do not have themselves (a jump), unless they asked to go back to it. */
    public static Set<Integer> skippedSteps(List<List<Long>> steps, Set<Long> owned, Set<Integer> restarted) {
        int highest = highestDone(steps, owned);
        Set<Integer> skipped = new java.util.TreeSet<>();
        for (int i = 0; i < highest; i++) {
            if (!hasStep(steps.get(i), owned) && !restarted.contains(i)) skipped.add(i);
        }
        return skipped;
    }

    /**
     * The step to suggest: a step the learner asked to go back to (the first one they still do not have), else the step
     * after the last one they have. Empty when they have none of the pathway or have finished it.
     */
    public static java.util.OptionalInt nextStepIndex(List<List<Long>> steps, Set<Long> owned, Set<Integer> restarted) {
        for (int i = 0; i < steps.size(); i++) {
            if (restarted.contains(i) && !hasStep(steps.get(i), owned)) return java.util.OptionalInt.of(i);
        }
        int highest = highestDone(steps, owned);
        return highest >= 0 && highest + 1 < steps.size() ? java.util.OptionalInt.of(highest + 1) : java.util.OptionalInt.empty();
    }

    /** The courses of a step ordered so those made by a partner in `relatedPartners` come first (the order inside each group is kept). */
    public static List<Long> relatedFirst(List<Long> step, Map<Long, Long> partnerOfItem, Set<Long> relatedPartners) {
        List<Long> related = new java.util.ArrayList<>();
        List<Long> others = new java.util.ArrayList<>();
        for (Long itemId : step) (relatedPartners.contains(partnerOfItem.get(itemId)) ? related : others).add(itemId);
        related.addAll(others);
        return related;
    }

    /** One suggestion per course (the best score), best first, at most `limit`. */
    public static List<Candidate> rank(List<Candidate> candidates, int limit) {
        Map<Long, Candidate> best = new LinkedHashMap<>();
        for (Candidate candidate : candidates) {
            best.merge(candidate.itemId(), candidate, (a, b) -> b.score() > a.score() ? b : a);
        }
        return best.values().stream()
                .sorted(Comparator.comparingInt(Candidate::score).reversed().thenComparing(Candidate::itemId))
                .limit(Math.max(limit, 0)).toList();
    }

    public static LocalDateTime dismissedUntil(LocalDateTime now, int days) {
        return now.plusDays(days);
    }

    public static boolean validSource(String source) {
        return source != null && SOURCES.contains(source);
    }

    public static boolean validEvent(String event) {
        return "view".equals(event) || "click".equals(event);
    }

    public static String dayLabel(DayOfWeek day) {
        return day == DayOfWeek.SUNDAY ? "Chủ nhật" : "Thứ " + (day.getValue() + 1);
    }

    public static String ageText(Integer age) {
        return age == null ? "" : " " + age + " tuổi";
    }

    /** "mon,wed" or "Mon, Wed" -> days; unknown words are ignored. */
    public static List<DayOfWeek> parseDays(String weekdays) {
        List<DayOfWeek> days = new ArrayList<>();
        if (weekdays == null) return days;
        for (String part : weekdays.split("[,\\s]+")) {
            DayOfWeek day = switch (part.toLowerCase()) {
                case "mon" -> DayOfWeek.MONDAY;
                case "tue" -> DayOfWeek.TUESDAY;
                case "wed" -> DayOfWeek.WEDNESDAY;
                case "thu" -> DayOfWeek.THURSDAY;
                case "fri" -> DayOfWeek.FRIDAY;
                case "sat" -> DayOfWeek.SATURDAY;
                case "sun" -> DayOfWeek.SUNDAY;
                default -> null;
            };
            if (day != null && !days.contains(day)) days.add(day);
        }
        return days;
    }

    /** "17:30" -> 17:30, anything else null. */
    public static LocalTime parseTime(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            return LocalTime.parse(text.trim().length() == 5 ? text.trim() : text.trim().substring(0, 5));
        } catch (Exception e) {
            return null;
        }
    }

    /** The weekly slots of one class: each weekday with the class times. */
    public static List<Slot> slotsOf(String weekdays, String timeStart, String timeEnd) {
        LocalTime start = parseTime(timeStart);
        LocalTime end = parseTime(timeEnd);
        List<Slot> slots = new ArrayList<>();
        parseDays(weekdays).forEach(day -> slots.add(new Slot(day, start, end)));
        return slots;
    }
}
