package com.anylearn.backend.controller.auth;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.referral.ReferralRules;
import com.anylearn.backend.service.referral.ReferralService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ref")
@RequiredArgsConstructor
public class ReferralController {

    private final ReferralService referralService;

    /** Public: lets the /ref/{code} page check a link and greet the new visitor. Shows only the last word of the name. */
    @GetMapping("/{code}")
    public ApiResponse<?> check(@PathVariable String code) {
        return referralService.findReferrer(code, null)
                .<ApiResponse<?>>map(u -> ApiResponse.ok(Map.of("valid", true, "name", ReferralRules.displayName(u.getName()))))
                .orElseGet(() -> ApiResponse.ok(Map.of("valid", false)));
    }
}
