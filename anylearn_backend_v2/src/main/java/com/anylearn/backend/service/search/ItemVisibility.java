package com.anylearn.backend.service.search;

import com.anylearn.backend.entity.Contract;

/**
 * What a visitor may see: a course is shown when it is switched on (platform and partner both), and its partner is an
 * active member with a signed contract. Every public list uses this rule (the SQL text is for queries, the methods for code).
 */
public final class ItemVisibility {

    /** Condition on the partner row aliased `a` (users). */
    public static final String AUTHOR_LIVE_SQL = "a.status = 1 AND a.is_signed = " + Contract.APPROVED;

    /** Same, as a subquery on an items row aliased `i`. */
    public static final String VISIBLE_ITEM_SQL = "i.status = 1 AND i.user_status = 1 AND EXISTS "
            + "(SELECT 1 FROM users a WHERE a.id = i.user_id AND " + AUTHOR_LIVE_SQL + ")";

    private ItemVisibility() {}

    public static boolean isAuthorLive(Byte authorStatus, Byte authorIsSigned) {
        return authorStatus != null && authorStatus == 1 && authorIsSigned != null && authorIsSigned == Contract.APPROVED;
    }

    public static boolean isItemOn(Byte status, Byte userStatus) {
        return status != null && status == 1 && userStatus != null && userStatus == 1;
    }

    public static boolean isVisible(Byte status, Byte userStatus, Byte authorStatus, Byte authorIsSigned) {
        return isItemOn(status, userStatus) && isAuthorLive(authorStatus, authorIsSigned);
    }
}
