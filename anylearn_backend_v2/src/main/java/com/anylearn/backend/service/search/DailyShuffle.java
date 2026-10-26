package com.anylearn.backend.service.search;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/** A random order that stays the same for the same seed: "Thử điều mới" shows one list per day and child. */
public final class DailyShuffle {

    private DailyShuffle() {}

    public static <T> List<T> shuffle(List<T> items, String seed) {
        List<T> copy = new ArrayList<>(items);
        Collections.shuffle(copy, new Random(seedOf(seed)));
        return copy;
    }

    /**
     * Shuffles inside groups of `bandSize` and keeps the groups in order: the list stays roughly nearest-first (or
     * best-first) but each group is random, so a day's list is not simply the top of the ranking.
     */
    public static <T> List<T> shuffleInBands(List<T> ordered, int bandSize, String seed) {
        List<T> result = new ArrayList<>(ordered.size());
        for (int from = 0; from < ordered.size(); from += bandSize) {
            List<T> band = ordered.subList(from, Math.min(ordered.size(), from + bandSize));
            result.addAll(shuffle(band, seed + "|" + from));
        }
        return result;
    }

    /** One page of the shuffled list; a page past the end is empty. */
    public static <T> List<T> page(List<T> shuffled, int page, int pageSize) {
        int from = Math.max(0, page) * pageSize;
        if (from >= shuffled.size()) return List.of();
        return shuffled.subList(from, Math.min(shuffled.size(), from + pageSize));
    }

    // String.hashCode is specified by the JDK, so the order is the same on every server and after every restart.
    private static long seedOf(String seed) {
        return seed == null ? 0 : seed.hashCode();
    }
}
