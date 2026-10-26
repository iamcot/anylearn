package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.entity.UserLocation;
import com.anylearn.backend.service.location.GooglePlacesClient;
import com.anylearn.backend.service.location.LocationInput;
import com.anylearn.backend.service.location.LocationService;
import com.anylearn.backend.service.location.ResolvedPlace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Branches of a partner, and the address search that fills them in. */
@Slf4j
@RestController
@RequestMapping("/admin/locations")
@RequiredArgsConstructor
public class AdminLocationController {

    private static final int MIN_SEARCH_LENGTH = 3;

    private final LocationService locationService;
    private final GooglePlacesClient places;
    private final com.anylearn.backend.repository.ContractRepository contracts;
    private final com.anylearn.backend.service.location.ContractAddressImportService contractImport;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam Long userId) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(locationService.activeLocationsOf(userId).stream().map(AdminLocationController::view).toList());
    }

    /** The address written on the partner's contract (raw text), to prefill or search with when adding a branch. */
    @GetMapping("/contract-address")
    public ApiResponse<?> contractAddress(@AuthenticationPrincipal User user, @RequestParam Long userId) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return contracts.findWithAddress(userId, org.springframework.data.domain.PageRequest.of(0, 1)).stream().findFirst()
                .map(c -> ApiResponse.ok(Map.of("address", c.getAddress().trim(), "status", c.getStatus())))
                .orElse(ApiResponse.ok(null));
    }

    /** Partners with a signed or approved contract and no address: the list the bulk import works through. */
    @GetMapping("/contract-import")
    public ApiResponse<?> contractImportCandidates(@AuthenticationPrincipal User user,
                                                   @RequestParam(required = false) String q, @RequestParam(required = false) String role,
                                                   @RequestParam(required = false) Integer status, @RequestParam(required = false) Integer isSigned) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        var filters = new com.anylearn.backend.service.location.ContractAddressImportService.Filters(q, role, status, isSigned);
        return ApiResponse.ok(Map.of("enabled", places.isEnabled(), "candidates", contractImport.candidates(filters)));
    }

    /** Imports one partner (the page calls this one by one so it can show progress and be stopped). */
    @PostMapping("/contract-import/{userId}")
    public ApiResponse<?> contractImportOne(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!places.isEnabled()) return ApiResponse.fail("Chưa cấu hình Google Maps");
        try {
            var result = contractImport.importFor(userId);
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("outcome", result.outcome().name().toLowerCase());
            view.put("contractAddress", result.contractAddress());
            view.put("location", result.location() != null ? view(result.location()) : null);
            view.put("suggestions", result.suggestions());
            return ApiResponse.ok(view);
        } catch (RuntimeException e) {
            log.warn("Contract address import failed for {}: {}", userId, e.getMessage());
            return ApiResponse.fail("Không tìm được lúc này: " + e.getMessage());
        }
    }

    @GetMapping("/autocomplete")
    public ApiResponse<?> autocomplete(@AuthenticationPrincipal User user, @RequestParam String q,
                                       @RequestParam(required = false) String session) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!places.isEnabled()) return ApiResponse.ok(Map.of("enabled", false, "suggestions", List.of()));
        if (q.trim().length() < MIN_SEARCH_LENGTH) return ApiResponse.ok(Map.of("enabled", true, "suggestions", List.of()));
        try {
            return ApiResponse.ok(Map.of("enabled", true, "suggestions", places.autocomplete(q.trim(), session)));
        } catch (RuntimeException e) {
            log.warn("Google address search failed: {}", e.getMessage());
            return ApiResponse.fail("Không tìm được địa chỉ lúc này, vui lòng nhập tay");
        }
    }

    @GetMapping("/place")
    public ApiResponse<?> place(@AuthenticationPrincipal User user, @RequestParam String placeId,
                                @RequestParam(required = false) String session) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!places.isEnabled()) return ApiResponse.fail("Chưa cấu hình Google Maps");
        try {
            ResolvedPlace place = places.details(placeId, session);
            if (place == null) return ApiResponse.fail("Không tìm thấy địa chỉ này");
            return ApiResponse.ok(place);
        } catch (RuntimeException e) {
            log.warn("Google place details failed: {}", e.getMessage());
            return ApiResponse.fail("Không lấy được toạ độ lúc này, vui lòng nhập tay");
        }
    }

    @PostMapping
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("userId") instanceof Number userId)) return ApiResponse.fail("Thiếu đối tác");
        try {
            return ApiResponse.ok(view(locationService.create(userId.longValue(), input(body))));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    /** Several places picked from the search list at once: {userId, placeIds: [...], headPlaceId}. */
    @PostMapping("/bulk")
    public ApiResponse<?> createFromPlaces(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("userId") instanceof Number userId)) return ApiResponse.fail("Thiếu người dùng");
        if (!places.isEnabled()) return ApiResponse.fail("Chưa cấu hình Google Maps");
        if (!(body.get("placeIds") instanceof List<?> ids) || ids.isEmpty()) return ApiResponse.fail("Chưa chọn địa chỉ nào");
        try {
            List<LocationInput> inputs = new java.util.ArrayList<>();
            for (Object id : ids) {
                ResolvedPlace place = places.details(String.valueOf(id), null);
                if (place == null) continue;
                String title = place.name() == null || place.name().isBlank() ? place.formattedAddress() : place.name();
                inputs.add(new LocationInput(title, place.formattedAddress(), BigDecimal.valueOf(place.lat()), BigDecimal.valueOf(place.lng()),
                        place.placeId(), null, place.provinceName(), place.districtName(), place.wardName(), false));
            }
            if (inputs.isEmpty()) return ApiResponse.fail("Không lấy được thông tin các địa chỉ đã chọn");
            String headPlaceId = body.get("headPlaceId") instanceof String h ? h : null;
            return ApiResponse.ok(locationService.createAll(userId.longValue(), inputs, headPlaceId).stream().map(AdminLocationController::view).toList());
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        } catch (RuntimeException e) {
            log.warn("Google place details failed: {}", e.getMessage());
            return ApiResponse.fail("Không lấy được toạ độ lúc này, vui lòng thử lại");
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            return ApiResponse.ok(view(locationService.update(id, input(body))));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> hide(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        locationService.hide(id);
        return ApiResponse.ok("Hidden");
    }

    private static LocationInput input(Map<String, Object> body) {
        return new LocationInput(text(body, "title"), text(body, "address"), decimal(body, "lat"), decimal(body, "lng"),
                text(body, "placeId"), text(body, "phone"), text(body, "provinceName"), text(body, "districtName"),
                text(body, "wardName"), body.get("head") instanceof Boolean b ? b : null);
    }

    private static Map<String, Object> view(UserLocation l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.getId());
        m.put("userId", l.getUserId());
        m.put("title", l.getTitle());
        m.put("address", l.getAddress());
        m.put("lat", l.getLat());
        m.put("lng", l.getLng());
        m.put("phone", l.getPhone());
        m.put("provinceName", l.getProvinceName());
        m.put("districtName", l.getDistrictName());
        m.put("wardName", l.getWardName());
        m.put("head", l.getIsHead() != null && l.getIsHead() == 1);
        m.put("hasCoordinates", l.getLat() != null && l.getLng() != null);
        m.put("hasDistrict", l.getDistrictCode() != null);
        return m;
    }

    private static String text(Map<String, Object> body, String key) {
        return body.get(key) instanceof String s ? s : null;
    }

    private static BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value instanceof Number n) return new BigDecimal(n.toString());
        if (value instanceof String s && !s.isBlank()) {
            try {
                return new BigDecimal(s.trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Toạ độ không hợp lệ");
            }
        }
        return null;
    }

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
