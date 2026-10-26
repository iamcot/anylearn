package com.anylearn.backend.service.location;

import java.math.BigDecimal;

/** What the form sends for a partner branch. Administrative names come from Google; codes are matched on save when missing. */
public record LocationInput(
        String title, String address, BigDecimal lat, BigDecimal lng, String placeId, String phone,
        String provinceName, String districtName, String wardName, Boolean head) {

    public LocationInput asHead() {
        return new LocationInput(title, address, lat, lng, placeId, phone, provinceName, districtName, wardName, true);
    }
}
