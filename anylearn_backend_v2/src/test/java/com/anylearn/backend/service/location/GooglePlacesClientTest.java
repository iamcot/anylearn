package com.anylearn.backend.service.location;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GooglePlacesClientTest {

    private static final String BASE = "https://places.test/v1";

    @Test
    void withoutAKeyTheClientIsOff() {
        assertThat(new GooglePlacesClient(new RestTemplate(), BASE, "").isEnabled()).isFalse();
        assertThat(new GooglePlacesClient(new RestTemplate(), BASE, "key").isEnabled()).isTrue();
    }

    @Test
    void autocompleteSendsTheKeyAndVietnameseRegion() {
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        server.expect(requestTo(BASE + "/places:autocomplete")).andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Goog-Api-Key", "key"))
                .andRespond(withSuccess("{\"suggestions\":[{\"placePrediction\":{\"placeId\":\"p1\",\"text\":{\"text\":\"Nguyễn Huệ\"}}}]}",
                        MediaType.APPLICATION_JSON));

        var found = new GooglePlacesClient(http, BASE, "key").autocomplete("nguyen hue", "s1");

        assertThat(found).containsExactly(new PlaceSuggestion("p1", "Nguyễn Huệ"));
        server.verify();
    }

    @Test
    void detailsAskOnlyForTheFieldsWeUse() {
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        server.expect(requestTo(BASE + "/places/p1?languageCode=vi")).andExpect(method(HttpMethod.GET))
                .andExpect(header("X-Goog-FieldMask", "id,displayName,formattedAddress,location,addressComponents"))
                .andRespond(withSuccess("{\"id\":\"p1\",\"location\":{\"latitude\":10.77,\"longitude\":106.7}}", MediaType.APPLICATION_JSON));

        ResolvedPlace place = new GooglePlacesClient(http, BASE, "key").details("p1", null);

        assertThat(place.lat()).isEqualTo(10.77);
        server.verify();
    }
}
