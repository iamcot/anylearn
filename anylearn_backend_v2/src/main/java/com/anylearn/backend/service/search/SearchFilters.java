package com.anylearn.backend.service.search;

import java.time.LocalDate;
import java.util.List;

/**
 * Everything a visitor can narrow a course search by. Old bucket params (`age`, `priceRange`, `location`, `mode`) stay
 * for the current website; the others are the attributes from plan 03.
 */
public record SearchFilters(
        String category, Long authorId,
        String ageBucket, String priceBucket, String provinceCode, String mode,
        Integer learnerAgeMin, Integer learnerAgeMax,
        String districtCode,
        Double nearLat, Double nearLng, Double radiusKm,
        List<String> timeSlots, String partnerType, boolean freeTrial, boolean onSale,
        List<Long> tagIds, Long priceMin, Long priceMax, Integer startWithinDays,
        LocalDate today) {

    public boolean hasNear() {
        return nearLat != null && nearLng != null;
    }

    /** Test and controller helper: start from nothing, set only what the request carried. */
    public static final class Builder {
        private String category, ageBucket, priceBucket, provinceCode, mode, districtCode, partnerType;
        private Long authorId, priceMin, priceMax;
        private Integer learnerAgeMin, learnerAgeMax, startWithinDays;
        private Double nearLat, nearLng, radiusKm;
        private List<String> timeSlots = List.of();
        private List<Long> tagIds = List.of();
        private boolean freeTrial, onSale;
        private LocalDate today;

        public static Builder empty() { return new Builder(); }
        public Builder category(String v) { category = v; return this; }
        public Builder authorId(Long v) { authorId = v; return this; }
        public Builder ageBucket(String v) { ageBucket = v; return this; }
        public Builder priceBucket(String v) { priceBucket = v; return this; }
        public Builder provinceCode(String v) { provinceCode = v; return this; }
        public Builder mode(String v) { mode = v; return this; }
        public Builder districtCode(String v) { districtCode = v; return this; }
        public Builder learnerAge(Integer youngest, Integer oldest) { learnerAgeMin = youngest; learnerAgeMax = oldest; return this; }
        public Builder near(Double lat, Double lng, Double radius) { nearLat = lat; nearLng = lng; radiusKm = radius; return this; }
        public Builder timeSlots(List<String> v) { timeSlots = v; return this; }
        public Builder partnerType(String v) { partnerType = v; return this; }
        public Builder freeTrial() { freeTrial = true; return this; }
        public Builder onSale() { onSale = true; return this; }
        public Builder tags(List<Long> v) { tagIds = v; return this; }
        public Builder price(Long min, Long max) { priceMin = min; priceMax = max; return this; }
        public Builder startWithin(Integer days) { startWithinDays = days; return this; }
        public Builder today(LocalDate v) { today = v; return this; }

        public SearchFilters build() {
            return new SearchFilters(category, authorId, ageBucket, priceBucket, provinceCode, mode, learnerAgeMin, learnerAgeMax,
                    districtCode, nearLat, nearLng, radiusKm, timeSlots, partnerType, freeTrial, onSale, tagIds,
                    priceMin, priceMax, startWithinDays, today);
        }
    }
}
