package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ItemVisibilityTest {

    private static final byte ON = 1;
    private static final byte OFF = 0;
    private static final byte SIGNED = 99;

    @Test
    void shownWhenCourseIsOnAndPartnerIsActiveAndSigned() {
        assertTrue(ItemVisibility.isVisible(ON, ON, ON, SIGNED));
    }

    @Test
    void hiddenWhenAnyPartOfTheRuleFails() {
        assertFalse(ItemVisibility.isVisible(OFF, ON, ON, SIGNED), "switched off by the platform");
        assertFalse(ItemVisibility.isVisible(ON, OFF, ON, SIGNED), "not approved by the partner");
        assertFalse(ItemVisibility.isVisible(ON, ON, OFF, SIGNED), "partner inactive");
        assertFalse(ItemVisibility.isVisible(ON, ON, ON, OFF), "partner not signed");
        assertFalse(ItemVisibility.isVisible(ON, ON, ON, (byte) 10), "contract signed but not approved");
        assertFalse(ItemVisibility.isVisible(ON, ON, ON, (byte) 1), "new contract");
    }

    @Test
    void missingValuesCountAsHidden() {
        assertFalse(ItemVisibility.isVisible(null, ON, ON, SIGNED));
        assertFalse(ItemVisibility.isVisible(ON, ON, null, SIGNED));
        assertFalse(ItemVisibility.isAuthorLive(ON, null));
    }
}
