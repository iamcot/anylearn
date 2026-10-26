package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserLocationRepository;
import com.anylearn.backend.service.partners.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.anylearn.backend.service.search.NearbyPartners;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** What the public profile page of a partner shows besides the profile itself, and the follow button. */
@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final FollowService followService;
    private final UserLocationRepository userLocationRepository;
    private final JdbcTemplate jdbc;
    private final com.anylearn.backend.service.reviews.ReviewService reviewService;
    private final com.anylearn.backend.repository.UserRepository userRepository;
    private final com.anylearn.backend.service.settings.OperationSettingsService operationSettingsService;

    private static boolean partnerLive(User partner) {
        return com.anylearn.backend.service.search.ItemVisibility.isAuthorLive(partner.getStatus(), partner.getIsSigned());
    }

    /**
     * Schools with a branch inside the circle around the visitor, for the map popup of "Gần tôi". The radius is the one set in
     * the back office (Cài đặt > Vận hành) unless the search sent its own; the answer says which one was used.
     */
    @GetMapping("/nearby")
    public ApiResponse<?> nearby(@RequestParam Double lat, @RequestParam Double lng, @RequestParam(required = false) Double radiusKm) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return ApiResponse.fail("Vị trí không hợp lệ");
        double radius = radiusKm != null && radiusKm > 0 ? Math.min(radiusKm, 100) : operationSettingsService.nearRadiusKm();
        double[] box = NearbyPartners.boundingBox(lat, lng, radius);
        List<NearbyPartners.Branch> branches = jdbc.query(
                "SELECT a.id, a.name, a.image, a.introduce, l.lat, l.lng FROM users a JOIN user_locations l ON l.user_id = a.id AND l.status = 1 "
                        + "WHERE a.role = 'school' AND " + com.anylearn.backend.service.search.ItemVisibility.AUTHOR_LIVE_SQL
                        + " AND l.lat BETWEEN ? AND ? AND l.lng BETWEEN ? AND ?",
                (rs, row) -> new NearbyPartners.Branch(rs.getLong("id"), rs.getString("name"), rs.getString("image"),
                        rs.getString("introduce"), rs.getDouble("lat"), rs.getDouble("lng")),
                box[0], box[1], box[2], box[3]);
        return ApiResponse.ok(Map.of("radiusKm", radius, "partners", NearbyPartners.inRadius(branches, lat, lng, radius)));
    }

    @GetMapping("/{id}/summary")
    public ApiResponse<?> summary(@PathVariable Long id, @AuthenticationPrincipal User user) {
        var partner = userRepository.findById(id).orElse(null);
        if (partner == null) return ApiResponse.fail("Không tìm thấy đối tác");
        Long courses = partnerLive(partner)
                ? jdbc.queryForObject("SELECT COUNT(*) FROM items WHERE user_id = ? AND status = 1 AND user_status = 1", Long.class, id) : Long.valueOf(0);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("partnerType", partner.getPartnerType());
        map.put("courseCount", courses == null ? 0 : courses);
        map.put("followerCount", followService.countFollowers(id));
        map.put("following", user != null && followService.isFollowing(user.getId(), id));
        map.put("locations", userLocationRepository.findByUserIdAndStatus(id, (byte) 1).stream().map(l -> {
            Map<String, Object> place = new LinkedHashMap<>();
            place.put("id", l.getId());
            place.put("title", l.getTitle());
            place.put("address", l.getAddress());
            place.put("districtName", l.getDistrictName());
            place.put("provinceName", l.getProvinceName());
            place.put("lat", l.getLat());
            place.put("lng", l.getLng());
            place.put("isHead", l.getIsHead() != null && l.getIsHead() == 1);
            return place;
        }).toList());
        return ApiResponse.ok(map);
    }

    /** Reviews of every course of the partner: the numbers and the latest ones (partner page). */
    @GetMapping("/{id}/reviews")
    public ApiResponse<?> reviews(@PathVariable Long id) {
        Map<String, Object> result = new LinkedHashMap<>(reviewService.partnerSummary(id));
        result.put("latest", reviewService.partnerLatest(id, 6));
        return ApiResponse.ok(result);
    }

    @PostMapping("/{id}/follow")
    public ApiResponse<?> follow(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        if (!followService.follow(user.getId(), id)) return ApiResponse.fail("Không thể theo dõi đối tác này");
        return ApiResponse.ok(Map.of("following", true, "followerCount", followService.countFollowers(id)));
    }

    @DeleteMapping("/{id}/follow")
    public ApiResponse<?> unfollow(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        followService.unfollow(user.getId(), id);
        return ApiResponse.ok(Map.of("following", false, "followerCount", followService.countFollowers(id)));
    }

    @GetMapping("/followed")
    public ApiResponse<?> followed(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        List<Long> ids = jdbc.queryForList("SELECT partner_id FROM follows WHERE user_id = ?", Long.class, user.getId());
        return ApiResponse.ok(ids);
    }
}
