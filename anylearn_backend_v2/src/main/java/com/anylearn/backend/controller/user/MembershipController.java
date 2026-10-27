package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.membership.MemberTierService;
import com.anylearn.backend.service.membership.MembershipSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** The member's own tier and the public rules of the family offer. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MembershipController {

    private final MemberTierService tiers;
    private final MembershipSettings settings;

    @GetMapping("/me/tier")
    public ApiResponse<?> myTier(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(tiers.view(user));
    }

    @GetMapping("/membership/family-offer")
    public ApiResponse<?> familyOffer() {
        return ApiResponse.ok(Map.of("enabled", settings.familyEnabled(), "percent", settings.familyPercent(), "windowDays", settings.familyWindowDays()));
    }
}
