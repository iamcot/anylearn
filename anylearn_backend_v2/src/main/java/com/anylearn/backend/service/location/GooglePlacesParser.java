package com.anylearn.backend.service.location;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

/** Reads the answers of Google Places API (New). Pure, so it is tested with saved answers. */
public final class GooglePlacesParser {

    private GooglePlacesParser() {}

    public static List<PlaceSuggestion> suggestions(JsonNode answer) {
        List<PlaceSuggestion> result = new ArrayList<>();
        for (JsonNode item : answer.path("suggestions")) {
            JsonNode prediction = item.path("placePrediction");
            String placeId = prediction.path("placeId").asText("");
            String text = prediction.path("text").path("text").asText("");
            if (!placeId.isEmpty() && !text.isEmpty()) result.add(new PlaceSuggestion(placeId, text));
        }
        return result;
    }

    /** Vietnam: level 1 = province, level 2 = district, sublocality level 1 (or level 3) = ward. */
    public static ResolvedPlace place(JsonNode answer) {
        JsonNode location = answer.path("location");
        if (!location.has("latitude") || !location.has("longitude")) return null;
        return new ResolvedPlace(
                answer.path("id").asText(""),
                answer.path("displayName").path("text").asText(""),
                answer.path("formattedAddress").asText(""),
                location.path("latitude").asDouble(),
                location.path("longitude").asDouble(),
                component(answer, "administrative_area_level_1"),
                component(answer, "administrative_area_level_2"),
                firstNonNull(component(answer, "sublocality_level_1"), component(answer, "administrative_area_level_3")));
    }

    private static String component(JsonNode answer, String type) {
        for (JsonNode part : answer.path("addressComponents")) {
            for (JsonNode kind : part.path("types")) {
                if (type.equals(kind.asText())) return part.path("longText").asText(null);
            }
        }
        return null;
    }

    private static String firstNonNull(String first, String second) {
        return first != null ? first : second;
    }
}
