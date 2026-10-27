package com.anylearn.backend.service.membership;

import java.util.*;

/**
 * Family offer (plan 10.3): the second child and later of one account get a percentage off when they register
 * within a number of days of another child. Pure; the service feeds it the cart and the recent registrations.
 */
public final class FamilyDiscountRules {

    private FamilyDiscountRules() {}

    /** One cart line: its id, the learner (a child id, or the account itself) and the price. */
    public record Line(long id, long learnerId, boolean child, long price) {}

    /**
     * Discount in VND per cart line id (only lines that get one).
     * {@code recentChildren} = children of the account with a registration inside the window (cancelled orders do not count).
     * A child already registered recently is the "first child"; otherwise the first child of the cart is.
     */
    public static Map<Long, Long> discounts(List<Line> lines, Set<Long> recentChildren, int percent) {
        Map<Long, Long> result = new LinkedHashMap<>();
        if (percent <= 0) return result;
        List<Long> cartOnlyChildren = new ArrayList<>();
        for (Line line : lines) {
            if (line.child() && !recentChildren.contains(line.learnerId()) && !cartOnlyChildren.contains(line.learnerId())) {
                cartOnlyChildren.add(line.learnerId());
            }
        }
        for (Line line : lines) {
            if (!line.child() || line.price() <= 0 || recentChildren.contains(line.learnerId())) continue;
            boolean anchor = recentChildren.isEmpty() && !cartOnlyChildren.isEmpty() && cartOnlyChildren.get(0).equals(line.learnerId());
            if (anchor) continue;
            long off = line.price() * percent / 100;
            if (off > 0) result.put(line.id(), off);
        }
        return result;
    }
}
