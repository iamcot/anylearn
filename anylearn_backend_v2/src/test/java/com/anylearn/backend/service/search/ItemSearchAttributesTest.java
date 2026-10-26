package com.anylearn.backend.service.search;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.UserLocation;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ItemSearchAttributesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 26);

    private static ItemSchedule recurring(String weekdays, String start, LocalDate dateStart, LocalDate dateEnd) {
        ItemSchedule s = new ItemSchedule();
        s.setScheduleType("recurring");
        s.setWeekdays(weekdays);
        s.setTimeStart(start);
        s.setDateStart(dateStart);
        s.setDateEnd(dateEnd);
        return s;
    }

    private static UserLocation branch(long id, String lat, String lng, String district) {
        UserLocation b = new UserLocation();
        b.setId(id);
        b.setTitle("B" + id);
        b.setLat(lat == null ? null : new BigDecimal(lat));
        b.setLng(lng == null ? null : new BigDecimal(lng));
        b.setDistrictCode(district);
        b.setStatus((byte) 1);
        return b;
    }

    private static Item course() {
        Item item = new Item();
        item.setPrice(3_200_000L);
        item.setOrgPrice(4_000_000L);
        item.setCycleType("week");
        item.setCycleAmount(8);
        item.setActiviyTrial((byte) 1);
        item.setUserLocationId(2L);
        return item;
    }

    @Test
    void derivesEverythingFromScheduleAndBranches() {
        var attributes = ItemSearchAttributes.derive(course(),
                List.of(recurring("tue,thu", "18:00", TODAY.plusDays(5), null)),
                List.of(branch(1, "10.80", "106.70", "760"), branch(2, "10.77", "106.69", "761")), TODAY);

        assertThat(attributes.timeSlots()).containsExactly("weekday_evening");
        assertThat(attributes.nextStartDay()).isEqualTo((int) TODAY.plusDays(5).toEpochDay());
        assertThat(attributes.pricePerSession()).isEqualTo(200_000L);
        assertThat(attributes.onSale()).isTrue();
        assertThat(attributes.hasFreeTrial()).isTrue();
        assertThat(attributes.geo()).containsEntry("lat", 10.77);
        assertThat(attributes.districtCodes()).containsExactly("760", "761");
    }

    @Test
    void aRunningClassStartsToday() {
        Integer day = ItemSearchAttributes.nextStartDay(List.of(recurring("mon", "09:00", TODAY.minusDays(20), TODAY.plusDays(30))), null, TODAY);
        assertThat(day).isEqualTo((int) TODAY.toEpochDay());
    }

    @Test
    void anEndedClassHasNoNextStart() {
        assertThat(ItemSearchAttributes.nextStartDay(List.of(recurring("mon", "09:00", TODAY.minusDays(60), TODAY.minusDays(1))), null, TODAY)).isNull();
    }

    @Test
    void branchesWithoutCoordinatesGiveNoGeo() {
        var attributes = ItemSearchAttributes.derive(course(), List.of(), List.of(branch(2, null, null, "761")), TODAY);
        assertThat(attributes.geo()).isNull();
        assertThat(attributes.locations()).isEmpty();
        assertThat(attributes.districtCodes()).containsExactly("761");
    }

    @Test
    void aWeeklyClassWithoutDatesIsOngoing() {
        assertThat(ItemSearchAttributes.nextStartDay(List.of(recurring("mon", "09:00", null, null)), null, TODAY)).isEqualTo((int) TODAY.toEpochDay());
    }

    @Test
    void aCourseWithoutAddressUsesThePartnerHeadOffice() {
        var head = branch(7, "10.80", "106.70", "760");
        head.setIsHead((byte) 1);
        var attributes = ItemSearchAttributes.derive(course(), List.of(), List.of(),
                List.of(branch(6, "10.10", "106.10", "761"), head), TODAY);
        assertThat(attributes.locationFromPartner()).isTrue();
        assertThat(attributes.geo()).containsEntry("lat", 10.80);
        assertThat(attributes.locations()).hasSize(1);
        assertThat(attributes.districtCodes()).containsExactly("760");
    }

    @Test
    void ownAddressBeatsThePartnerFallback() {
        var attributes = ItemSearchAttributes.derive(course(), List.of(), List.of(branch(2, "10.77", "106.69", "761")),
                List.of(branch(7, "10.80", "106.70", "760")), TODAY);
        assertThat(attributes.locationFromPartner()).isFalse();
        assertThat(attributes.districtCodes()).containsExactly("761");
    }

    @Test
    void partnerWithoutCoordinatesGivesNoFallback() {
        var attributes = ItemSearchAttributes.derive(course(), List.of(), List.of(), List.of(branch(7, null, null, "760")), TODAY);
        assertThat(attributes.locationFromPartner()).isFalse();
        assertThat(attributes.geo()).isNull();
    }
}
