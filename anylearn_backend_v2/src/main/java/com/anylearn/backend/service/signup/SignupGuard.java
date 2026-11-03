package com.anylearn.backend.service.signup;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registrations per IP (in memory, one backend process): at most {@link SignupRules#PER_IP_HOUR} an hour and
 * {@link SignupRules#PER_IP_DAY} a day. Only successful registrations are counted, so a typo does not lock a family out.
 */
@Component
public class SignupGuard {

    private static final long HOUR = 3_600_000L;
    private static final long DAY = 24 * HOUR;

    private final Map<String, Deque<Long>> perIp = new ConcurrentHashMap<>();

    /** True while this IP may register again. */
    public boolean allowed(String ip, long nowMs) {
        Deque<Long> times = perIp.get(key(ip));
        if (times == null) return true;
        synchronized (times) {
            prune(times, nowMs);
            long lastHour = times.stream().filter(t -> t > nowMs - HOUR).count();
            return lastHour < SignupRules.PER_IP_HOUR && times.size() < SignupRules.PER_IP_DAY;
        }
    }

    public void record(String ip, long nowMs) {
        Deque<Long> times = perIp.computeIfAbsent(key(ip), k -> new ArrayDeque<>());
        synchronized (times) {
            prune(times, nowMs);
            times.addLast(nowMs);
        }
        if (perIp.size() > 50_000) perIp.entrySet().removeIf(e -> {
            synchronized (e.getValue()) { prune(e.getValue(), nowMs); return e.getValue().isEmpty(); }
        });
    }

    private static void prune(Deque<Long> times, long nowMs) {
        while (!times.isEmpty() && times.peekFirst() <= nowMs - DAY) times.pollFirst();
    }

    private static String key(String ip) {
        return ip == null || ip.isBlank() ? "?" : ip;
    }
}
