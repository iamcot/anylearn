package com.anylearn.backend.service.location;

/** What Google knows about one address; the names are matched to our province, district and ward codes later. */
public record ResolvedPlace(
        String placeId, String name, String formattedAddress, double lat, double lng,
        String provinceName, String districtName, String wardName) {
}
