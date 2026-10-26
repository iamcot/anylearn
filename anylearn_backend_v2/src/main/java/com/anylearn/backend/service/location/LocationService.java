package com.anylearn.backend.service.location;

import com.anylearn.backend.entity.District;
import com.anylearn.backend.entity.Province;
import com.anylearn.backend.entity.UserLocation;
import com.anylearn.backend.entity.Ward;
import com.anylearn.backend.repository.DistrictRepository;
import com.anylearn.backend.repository.ProvinceRepository;
import com.anylearn.backend.repository.UserLocationRepository;
import com.anylearn.backend.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** The branches of a partner. A course schedule points at one of them. */
@Service
@RequiredArgsConstructor
public class LocationService {

    private final UserLocationRepository locations;
    private final ProvinceRepository provinces;
    private final DistrictRepository districts;
    private final WardRepository wards;

    public List<UserLocation> activeLocationsOf(Long userId) {
        return locations.findByUserIdAndStatus(userId, (byte) 1);
    }

    @Transactional
    public UserLocation create(Long userId, LocationInput input) {
        requireValid(input);
        Optional<UserLocation> same = input.placeId() == null ? Optional.empty()
                : locations.findByUserIdAndPlaceIdAndStatus(userId, input.placeId(), (byte) 1).stream().findFirst();
        if (same.isPresent()) return same.get();
        UserLocation location = new UserLocation();
        location.setUserId(userId);
        location.setStatus((byte) 1);
        location.setCreatedAt(LocalDateTime.now());
        boolean first = activeLocationsOf(userId).isEmpty();
        location.setIsHead((byte) (first || Boolean.TRUE.equals(input.head()) ? 1 : 0));
        if (location.getIsHead() == 1) demoteOtherHeads(userId, null);
        return locations.save(fill(location, input));
    }

    /** Saves several places picked from the address search; the one in `headPlaceId` becomes the head office. */
    @Transactional
    public List<UserLocation> createAll(Long userId, List<LocationInput> inputs, String headPlaceId) {
        List<UserLocation> saved = new java.util.ArrayList<>();
        for (LocationInput input : inputs) {
            boolean head = headPlaceId != null && headPlaceId.equals(input.placeId());
            saved.add(create(userId, head ? input.asHead() : input));
        }
        return saved;
    }

    @Transactional
    public UserLocation update(Long id, LocationInput input) {
        requireValid(input);
        UserLocation location = locations.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cơ sở"));
        if (Boolean.TRUE.equals(input.head())) {
            demoteOtherHeads(location.getUserId(), id);
            location.setIsHead((byte) 1);
        }
        return locations.save(fill(location, input));
    }

    @Transactional
    public void hide(Long id) {
        locations.findById(id).ifPresent(location -> {
            location.setStatus((byte) 0);
            location.setUpdatedAt(LocalDateTime.now());
            locations.save(location);
        });
    }

    /** The province, district and ward codes for the names Google returned; missing ones stay null. */
    public AdministrativeCodes codesFor(String provinceName, String districtName, String wardName) {
        Optional<String> province = AdministrativeMatcher.matchCode(
                provinces.findAll().stream().map(p -> new AdministrativeMatcher.Entry(p.getCode(), p.getName())).toList(), provinceName);
        Optional<String> district = province.flatMap(code -> AdministrativeMatcher.matchCode(
                districts.findByParentCode(code).stream().map(d -> new AdministrativeMatcher.Entry(d.getCode(), d.getName())).toList(), districtName));
        Optional<String> ward = district.flatMap(code -> AdministrativeMatcher.matchCode(
                wards.findByParentCode(code).stream().map(w -> new AdministrativeMatcher.Entry(w.getCode(), w.getName())).toList(), wardName));
        return new AdministrativeCodes(province.orElse(null), district.orElse(null), ward.orElse(null));
    }

    public record AdministrativeCodes(String provinceCode, String districtCode, String wardCode) {}

    private UserLocation fill(UserLocation location, LocationInput input) {
        location.setTitle(input.title().trim());
        location.setAddress(input.address().trim());
        location.setLat(input.lat());
        location.setLng(input.lng());
        location.setPlaceId(blankToNull(input.placeId()));
        location.setPhone(blankToNull(input.phone()));
        location.setProvinceName(blankToNull(input.provinceName()));
        location.setDistrictName(blankToNull(input.districtName()));
        location.setWardName(blankToNull(input.wardName()));
        AdministrativeCodes codes = codesFor(input.provinceName(), input.districtName(), input.wardName());
        location.setProvinceCode(codes.provinceCode());
        location.setDistrictCode(codes.districtCode());
        location.setWardCode(codes.wardCode());
        location.setUpdatedAt(LocalDateTime.now());
        return location;
    }

    private void demoteOtherHeads(Long userId, Long exceptId) {
        for (UserLocation other : activeLocationsOf(userId)) {
            if (other.getId().equals(exceptId) || other.getIsHead() == 0) continue;
            other.setIsHead((byte) 0);
            locations.save(other);
        }
    }

    private void requireValid(LocationInput input) {
        String problem = LocationRules.validate(input.title(), input.address(), input.lat(), input.lng());
        if (problem != null) throw new IllegalArgumentException(problem);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
