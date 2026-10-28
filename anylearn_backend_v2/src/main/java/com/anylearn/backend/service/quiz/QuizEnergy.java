package com.anylearn.backend.service.quiz;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Pure rules of the energy bar of the rank quiz (plan 15). Nothing runs on a timer: the bar is worked out when it is read,
 * `current = min(max, stored + floor(elapsed / regen))`. A person who never played has no stored value (null = full bar).
 */
public final class QuizEnergy {

    private QuizEnergy() {}

    /** The value saved in the profile and the moment its next point started counting. */
    public record State(int value, LocalDateTime at) {}

    private static long regenSeconds(int regenMinutes) {
        return Math.max(regenMinutes, 1) * 60L;
    }

    private static long ticks(LocalDateTime at, LocalDateTime now, int regenMinutes) {
        if (at == null) return 0;
        long elapsed = Duration.between(at, now).getSeconds();
        return elapsed <= 0 ? 0 : elapsed / regenSeconds(regenMinutes);
    }

    /** Energy the person has right now. */
    public static int current(Integer stored, LocalDateTime at, LocalDateTime now, int max, int regenMinutes) {
        if (stored == null) return max;
        long value = (long) Math.max(stored, 0) + ticks(at, now, regenMinutes);
        return (int) Math.min(value, max);
    }

    /** Seconds until the next point, 0 when the bar is full. */
    public static long nextInSeconds(Integer stored, LocalDateTime at, LocalDateTime now, int max, int regenMinutes) {
        if (current(stored, at, now, max, regenMinutes) >= max || at == null) return 0;
        long elapsed = Math.max(Duration.between(at, now).getSeconds(), 0);
        long step = regenSeconds(regenMinutes);
        return step - (elapsed % step);
    }

    /** The moment the bar goes on counting from after a change: now when it was full, else the progress of the running point is kept. */
    private static LocalDateTime anchor(Integer stored, LocalDateTime at, LocalDateTime now, int max, int regenMinutes) {
        int current = current(stored, at, now, max, regenMinutes);
        if (stored == null || at == null || current >= max) return now;
        return at.plusSeconds(ticks(at, now, regenMinutes) * regenSeconds(regenMinutes));
    }

    /** The state after spending `cost`, or null when the person does not have that much. */
    public static State spend(Integer stored, LocalDateTime at, LocalDateTime now, int max, int regenMinutes, int cost) {
        int current = current(stored, at, now, max, regenMinutes);
        if (cost > current) return null;
        return new State(current - cost, anchor(stored, at, now, max, regenMinutes));
    }

    /** The state after adding `amount`, never above `max`. */
    public static State add(Integer stored, LocalDateTime at, LocalDateTime now, int max, int regenMinutes, int amount) {
        int current = current(stored, at, now, max, regenMinutes);
        int value = (int) Math.min((long) current + Math.max(amount, 0), max);
        LocalDateTime when = value >= max ? now : anchor(stored, at, now, max, regenMinutes);
        return new State(value, when);
    }

    /** "03:12" for 192 seconds. */
    public static String mmss(long seconds) {
        long s = Math.max(seconds, 0);
        return String.format("%02d:%02d", s / 60, s % 60);
    }
}
