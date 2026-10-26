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
