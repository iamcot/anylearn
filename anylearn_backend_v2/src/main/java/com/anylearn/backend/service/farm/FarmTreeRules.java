package com.anylearn.backend.service.farm;

import java.time.LocalDateTime;

/** Pure rules of the perennial trees (3 tree slots): when each slot opens and what a tree is doing. */
public final class FarmTreeRules {

    private FarmTreeRules() {}

    public static final int[] SLOT_LEVELS = {10, 11, 12};

    public enum Phase { SAPLING, GROWN, FRUITING, RESTING }

    public static int slotLevel(int slot) {
        return slot < 0 || slot >= SLOT_LEVELS.length ? 99 : SLOT_LEVELS[slot];
    }

    /** SAPLING until the first fruit, GROWN while waiting for the next one, FRUITING when it can be picked, RESTING when all cycles are used. */
    public static Phase phase(LocalDateTime nextReadyAt, int done, int cycles, LocalDateTime now) {
        if (done >= cycles) return Phase.RESTING;
        if (!now.isBefore(nextReadyAt)) return Phase.FRUITING;
        return done == 0 ? Phase.SAPLING : Phase.GROWN;
    }
}
