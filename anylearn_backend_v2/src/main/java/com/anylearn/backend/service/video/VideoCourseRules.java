package com.anylearn.backend.service.video;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/** Pure rules of the video courses (plan 17): who may play a lesson, when a lesson is done, where to resume, study plans. */
public final class VideoCourseRules {

    private VideoCourseRules() {}

    public static final List<String> TYPES = List.of("video", "link", "text");

    /** Most real seconds one progress call may add (the player saves every 15 s; a little slack for a slow network). */
    public static final int MAX_WATCH_DELTA = 60;

    /** A lesson is played when it is free, or when the person has access to the course. */
    public static boolean canWatch(boolean free, boolean hasAccess) {
        return free || hasAccess;
    }

    /**
     * Bunny's numeric state of a video to ours: 4 finished (7, 8 = playable while segmenting) = ready, 5 error and
     * 6 upload failed = failed, 0 created = uploading, anything else = processing.
     */
    public static String videoStatus(int bunnyStatus) {
        return switch (bunnyStatus) {
            case 4, 7, 8 -> "ready";
            case 5, 6 -> "failed";
            case 0 -> "uploading";
            default -> "processing";
        };
    }

    /**
     * A lesson with a known length is done when the viewer reached `completePercent` of it and really watched at least
     * `minWatchPercent` of it (seeking forward does not count). Without a length it is done only when marked by hand.
     */
    public static boolean isComplete(Integer durationSeconds, int positionSeconds, int watchedSeconds, int completePercent, int minWatchPercent) {
        if (durationSeconds == null || durationSeconds <= 0) return false;
        return positionSeconds * 100L >= (long) durationSeconds * completePercent
                && watchedSeconds * 100L >= (long) durationSeconds * minWatchPercent;
    }

    /** Real seconds to add from one progress call: never negative, never more than {@link #MAX_WATCH_DELTA}. */
    public static int clampDelta(int delta) {
        return Math.max(0, Math.min(MAX_WATCH_DELTA, delta));
    }

    /** Where to start again next time: a position near the end (or past it) starts the lesson from the beginning. */
    public static int resumePosition(Integer durationSeconds, int positionSeconds) {
        if (positionSeconds <= 0) return 0;
        if (durationSeconds != null && durationSeconds > 0 && positionSeconds >= durationSeconds - 5) return 0;
        return positionSeconds;
    }

    public static int percent(int done, int total) {
        if (total <= 0) return 0;
        return (int) Math.min(100, Math.round(done * 100.0 / total));
    }

    /** Progress of one lesson for {@link #resumeLesson}. */
    public record LessonState(boolean completed, LocalDateTime touchedAt) {}

    /**
     * The lesson to open: the last one touched if it is not done; else the first not-done lesson after it; else the
     * first not-done lesson of the course; else (all done) the first lesson. Null when the course has no lesson.
     */
    public static Long resumeLesson(List<Long> orderedLessonIds, Map<Long, LessonState> progress) {
        if (orderedLessonIds.isEmpty()) return null;
        Long last = null;
        LocalDateTime lastAt = null;
        for (Long id : orderedLessonIds) {
            LessonState s = progress.get(id);
            if (s != null && s.touchedAt() != null && (lastAt == null || s.touchedAt().isAfter(lastAt))) {
                last = id;
                lastAt = s.touchedAt();
            }
        }
        if (last != null) {
            if (!done(progress, last)) return last;
            for (int i = orderedLessonIds.indexOf(last) + 1; i < orderedLessonIds.size(); i++) {
                if (!done(progress, orderedLessonIds.get(i))) return orderedLessonIds.get(i);
            }
        }
        for (Long id : orderedLessonIds) if (!done(progress, id)) return id;
        return orderedLessonIds.get(0);
    }

    private static boolean done(Map<Long, LessonState> progress, Long id) {
        LessonState s = progress.get(id);
        return s != null && s.completed();
    }

    /** The lesson after `lessonId` in course order, or null for the last one. */
    public static Long nextLesson(List<Long> orderedLessonIds, Long lessonId) {
        int i = orderedLessonIds.indexOf(lessonId);
        return i < 0 || i + 1 >= orderedLessonIds.size() ? null : orderedLessonIds.get(i + 1);
    }

    /** The highest milestone (`suggestPercent` or 100) crossed between two course percentages, or 0 for none. */
    public static int crossedMilestone(int before, int after, int suggestPercent) {
        if (after >= 100 && before < 100) return 100;
        if (suggestPercent > 0 && suggestPercent < 100 && after >= suggestPercent && before < suggestPercent) return suggestPercent;
        return 0;
    }

    // ── Study plan ─────────────────────────────────────────────────────────────

    /** "1,3,5" (1 = Monday .. 7 = Sunday) to a sorted list without repeats; values outside 1..7 are dropped. */
    public static List<Integer> parseWeekdays(String text) {
        TreeSet<Integer> out = new TreeSet<>();
        if (text != null) {
            for (String part : text.split(",")) {
                try {
                    int d = Integer.parseInt(part.trim());
                    if (d >= 1 && d <= 7) out.add(d);
                } catch (NumberFormatException ignored) {
                    // skip
                }
            }
        }
        return new ArrayList<>(out);
    }

    public static String weekdaysText(List<Integer> days) {
        return String.join(",", new TreeSet<>(days).stream().map(String::valueOf).toList());
    }

    /** Why a plan cannot be saved, or null. */
    public static String planProblem(List<Integer> weekdays, LocalTime time, int lessonsPerSession) {
        if (weekdays.isEmpty()) return "Chọn ít nhất một ngày trong tuần";
        if (time == null) return "Chọn giờ học";
        if (lessonsPerSession < 1 || lessonsPerSession > 10) return "Số bài mỗi buổi từ 1 đến 10";
        return null;
    }

    /**
     * Whether a study reminder is due now: today is one of the plan's days and the time is within `windowMinutes`
     * after the plan's time (the job runs every 15 minutes; later than the window = skipped, never sent late at night).
     */
    public static boolean reminderDue(List<Integer> weekdays, LocalTime studyTime, LocalDateTime now, int windowMinutes) {
        if (!weekdays.contains(now.getDayOfWeek().getValue())) return false;
        int diff = now.toLocalTime().toSecondOfDay() - studyTime.toSecondOfDay();
        return diff >= 0 && diff < windowMinutes * 60;
    }

    /** Short Vietnamese text of a plan: "T3, T5, T7 lúc 20:00". */
    public static String planText(List<Integer> weekdays, LocalTime time) {
        List<String> names = new ArrayList<>();
        for (Integer d : weekdays) names.add(d == 7 ? "CN" : "T" + (d + 1));
        return String.join(", ", names) + (time == null ? "" : " lúc " + String.format("%02d:%02d", time.getHour(), time.getMinute()));
    }

    public static boolean isStudyDay(List<Integer> weekdays, DayOfWeek day) {
        return weekdays.contains(day.getValue());
    }

    // ── Bunny token authentication ──────────────────────────────────────────────

    /**
     * Bunny CDN token authentication, directory form, so one link signs the playlist and every segment of a video:
     * `https://{host}/bcdn_token={token}&expires={exp}&token_path={encoded dir}{path}` with
     * token = base64url(sha256(key + dir + expires + "token_path=" + dir)) without padding.
     */
    public static String signedUrl(String host, String tokenKey, String videoId, String file, long expires) {
        String dir = "/" + videoId + "/";
        String base = tokenKey + dir + expires + "token_path=" + dir;
        String token;
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(base.getBytes(StandardCharsets.UTF_8));
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
        String encodedDir = java.net.URLEncoder.encode(dir, StandardCharsets.UTF_8);
        return "https://" + host + "/bcdn_token=" + token + "&token_path=" + encodedDir + "&expires=" + expires + dir + file;
    }

    /** Seconds as "1 giờ 5 phút" / "12 phút" / "45 giây". */
    public static String durationText(long seconds) {
        if (seconds <= 0) return "";
        long h = seconds / 3600, m = (seconds % 3600) / 60;
        if (h > 0) return h + " giờ" + (m > 0 ? " " + m + " phút" : "");
        if (m > 0) return m + " phút";
        return seconds + " giây";
    }

    /** Longest note and most notes one learner keeps on one lesson. */
    public static final int NOTE_MAX_LENGTH = 500;
    public static final int NOTES_PER_LESSON = 100;

    /** Why a note cannot be saved, or null: text between 1 and {@link #NOTE_MAX_LENGTH} characters, a position inside the lesson. */
    public static String noteProblem(String body, int positionSeconds, Integer lessonSeconds, int existing) {
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) return "Hãy nhập nội dung ghi chú";
        if (text.length() > NOTE_MAX_LENGTH) return "Ghi chú tối đa " + NOTE_MAX_LENGTH + " ký tự";
        if (positionSeconds < 0 || (lessonSeconds != null && positionSeconds > lessonSeconds + 2)) return "Thời điểm ghi chú không hợp lệ";
        if (existing >= NOTES_PER_LESSON) return "Bài này đã có " + NOTES_PER_LESSON + " ghi chú, hãy xóa bớt";
        return null;
    }
}
