package com.anylearn.backend.service.location;

import com.anylearn.backend.entity.UserLocation;
import com.anylearn.backend.repository.ContractRepository;
import com.anylearn.backend.repository.UserLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * One-off helper: gives partners that have a signed or approved contract but no address their head office, using the raw
 * address on the contract. Only a single clear Google match is saved; anything doubtful is left for a person.
 */
@Service
@RequiredArgsConstructor
public class ContractAddressImportService {

    public static final int CANDIDATE_LIMIT = 500;
    private static final String HEAD_OFFICE_TITLE = "Hội sở";
    private static final int REVIEW_SUGGESTIONS = 3;

    public enum Outcome { ADDED, REVIEW, NOT_FOUND, SKIPPED }

    public record Result(Outcome outcome, String contractAddress, UserLocation location, List<String> suggestions) {}

    private final ContractRepository contracts;
    private final UserLocationRepository locations;
    private final GooglePlacesClient places;
    private final LocationService locationService;

    /** The member list filters the page is showing (all optional) narrow the partners to import. */
    public record Filters(String q, String role, Integer status, Integer signed) {}

    public List<Map<String, Object>> candidates(Filters filters) {
        String q = filters.q() == null || filters.q().isBlank() ? null : filters.q().trim();
        String role = filters.role() == null || filters.role().isBlank() ? null : filters.role();
        return contracts.findImportCandidates(q, role, filters.status(), filters.signed(), CANDIDATE_LIMIT);
    }

    public Result importFor(Long userId) {
        String contractAddress = contracts.findSignedAddress(userId).stream().findFirst().orElse(null);
        // Someone may have added an address since the list was loaded.
        if (contractAddress == null || !locations.findByUserIdAndStatus(userId, (byte) 1).isEmpty())
            return new Result(Outcome.SKIPPED, contractAddress, null, List.of());

        List<PlaceSuggestion> found = places.autocomplete(contractAddress, null);
        if (found.isEmpty()) return new Result(Outcome.NOT_FOUND, contractAddress, null, List.of());
        List<PlaceSuggestion> sure = found.stream().filter(s -> AddressMatch.confident(contractAddress, s.text())).toList();
        if (sure.size() != 1) return new Result(Outcome.REVIEW, contractAddress, null,
                found.stream().limit(REVIEW_SUGGESTIONS).map(PlaceSuggestion::text).toList());

        ResolvedPlace place = places.details(sure.get(0).placeId(), null);
        if (place == null) return new Result(Outcome.NOT_FOUND, contractAddress, null, List.of());
        UserLocation saved = locationService.create(userId, new LocationInput(HEAD_OFFICE_TITLE, place.formattedAddress(),
                BigDecimal.valueOf(place.lat()), BigDecimal.valueOf(place.lng()), place.placeId(), null,
                place.provinceName(), place.districtName(), place.wardName(), true));
        return new Result(Outcome.ADDED, contractAddress, saved, List.of());
    }
}
