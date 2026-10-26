package com.anylearn.backend.service.location;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/** Address search and details from Google Places API (New). The key stays on the server. */
@Component
public class GooglePlacesClient {

    private static final String DETAIL_FIELDS = "id,displayName,formattedAddress,location,addressComponents";

    private final RestTemplate http;
    private final String baseUrl;
    private final String apiKey;

    public GooglePlacesClient(RestTemplate googleRestTemplate,
                              @Value("${app.google-maps.base-url:https://places.googleapis.com/v1}") String baseUrl,
                              @Value("${app.google-maps.api-key:}") String apiKey) {
        this.http = googleRestTemplate;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public List<PlaceSuggestion> autocomplete(String input, String sessionToken) {
        Map<String, Object> body = new java.util.HashMap<>(Map.of(
                "input", input, "languageCode", "vi", "includedRegionCodes", List.of("vn")));
        if (sessionToken != null && !sessionToken.isBlank()) body.put("sessionToken", sessionToken);
        JsonNode answer = http.exchange(baseUrl + "/places:autocomplete", HttpMethod.POST,
                new HttpEntity<>(body, headers(null)), JsonNode.class).getBody();
        return answer == null ? List.of() : GooglePlacesParser.suggestions(answer);
    }

    public ResolvedPlace details(String placeId, String sessionToken) {
        String url = baseUrl + "/places/{id}?languageCode=vi" + (sessionToken == null || sessionToken.isBlank() ? "" : "&sessionToken=" + sessionToken);
        JsonNode answer = http.exchange(url, HttpMethod.GET, new HttpEntity<>(headers(DETAIL_FIELDS)),
                JsonNode.class, placeId).getBody();
        return answer == null ? null : GooglePlacesParser.place(answer);
    }

    private HttpHeaders headers(String fieldMask) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", apiKey);
        if (fieldMask != null) headers.set("X-Goog-FieldMask", fieldMask);
        return headers;
    }
}
