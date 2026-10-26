package com.anylearn.backend.service.location;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GooglePlacesParserTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Test
    void readsSuggestions() throws Exception {
        var answer = JSON.readTree("""
                {"suggestions":[
                  {"placePrediction":{"placeId":"abc","text":{"text":"12 Nguyễn Huệ, Quận 1, Hồ Chí Minh"}}},
                  {"queryPrediction":{"text":{"text":"nguyen hue"}}}
                ]}""");
        assertThat(GooglePlacesParser.suggestions(answer))
                .containsExactly(new PlaceSuggestion("abc", "12 Nguyễn Huệ, Quận 1, Hồ Chí Minh"));
    }

    @Test
    void noSuggestionsIsAnEmptyList() throws Exception {
        assertThat(GooglePlacesParser.suggestions(JSON.readTree("{}"))).isEqualTo(List.of());
    }

    @Test
    void readsCoordinatesAndAdministrativeNames() throws Exception {
        var answer = JSON.readTree("""
                {"id":"abc","displayName":{"text":"Trung tâm A"},"formattedAddress":"12 Nguyễn Huệ, Bến Nghé, Quận 1",
                 "location":{"latitude":10.7745,"longitude":106.7032},
                 "addressComponents":[
                   {"longText":"12","types":["street_number"]},
                   {"longText":"Phường Bến Nghé","types":["sublocality_level_1","sublocality","political"]},
                   {"longText":"Quận 1","types":["administrative_area_level_2","political"]},
                   {"longText":"Thành phố Hồ Chí Minh","types":["administrative_area_level_1","political"]}]}""");
        ResolvedPlace place = GooglePlacesParser.place(answer);
        assertThat(place.lat()).isEqualTo(10.7745);
        assertThat(place.lng()).isEqualTo(106.7032);
        assertThat(place.provinceName()).isEqualTo("Thành phố Hồ Chí Minh");
        assertThat(place.districtName()).isEqualTo("Quận 1");
        assertThat(place.wardName()).isEqualTo("Phường Bến Nghé");
    }

    @Test
    void wardFallsBackToLevelThree() throws Exception {
        var answer = JSON.readTree("""
                {"id":"x","location":{"latitude":21.0,"longitude":105.8},
                 "addressComponents":[{"longText":"Phường Cống Vị","types":["administrative_area_level_3"]}]}""");
        assertThat(GooglePlacesParser.place(answer).wardName()).isEqualTo("Phường Cống Vị");
    }

    @Test
    void aPlaceWithoutLocationIsNotUsable() throws Exception {
        assertThat(GooglePlacesParser.place(JSON.readTree("{\"id\":\"x\"}"))).isNull();
    }
}
