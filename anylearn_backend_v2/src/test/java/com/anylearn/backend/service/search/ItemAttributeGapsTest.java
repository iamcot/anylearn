package com.anylearn.backend.service.search;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.service.search.ItemAttributeGaps.Facts;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ItemAttributeGapsTest {

    private static Item course(String subtype) {
        Item item = new Item();
        item.setSubtype(subtype);
        item.setAgesMin((byte) 6);
        item.setCycleType("session");
        item.setCycleAmount(10);
        return item;
    }

    @Test
    void aCompleteOfflineCourseHasNoGaps() {
        assertThat(ItemAttributeGaps.of(course("offline"), new Facts(1, 2, 1, 1, true))).isEmpty();
    }

    @Test
    void anEmptyOfflineCourseListsEverythingMissing() {
        Item item = new Item();
        item.setSubtype("offline");
        assertThat(ItemAttributeGaps.of(item, new Facts(0, 0, 0, 0, false)))
                .containsExactly("ages", "category", "tags", "location", "schedule", "sessions", "partnerType");
    }

    @Test
    void onlineCoursesNeedNoPlace() {
        assertThat(ItemAttributeGaps.of(course("online"), new Facts(1, 1, 1, 0, true))).isEmpty();
    }

    @Test
    void codeAndVideoCoursesNeedNeitherPlaceNorSchedule() {
        Item item = new Item();
        item.setSubtype("digital");
        item.setAgesMax((byte) 12);
        assertThat(ItemAttributeGaps.of(item, new Facts(1, 1, 0, 0, true))).isEmpty();
    }
}
