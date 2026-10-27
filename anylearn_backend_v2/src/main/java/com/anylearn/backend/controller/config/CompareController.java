package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.compare.CompareAiService;
import com.anylearn.backend.service.compare.CompareRules;
import com.anylearn.backend.service.compare.CompareService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Course comparison (plan 04.6): the figures first, the AI's reading of the descriptions in a second call. */
@RestController
@RequestMapping("/api/compare")
@RequiredArgsConstructor
public class CompareController {

    private final CompareService compare;
    private final CompareAiService ai;

    @GetMapping
    public ApiResponse<?> figures(@RequestParam String ids, @RequestParam(required = false) String lat, @RequestParam(required = false) String lng) {
        List<Long> parsed = CompareRules.parseIds(ids);
        Map<String, Object> result = compare.compare(parsed, number(lat), number(lng));
        result.put("factLabels", CompareRules.FACT_LABELS);
        return ApiResponse.ok(result);
    }

    /** A position the browser could not give arrives as "undefined" or empty: treat it as no position, never as an error. */
    private static Double number(String value) {
        if (value == null) return null;
        try {
            double parsed = Double.parseDouble(value.trim());
            return Double.isFinite(parsed) ? parsed : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/highlights")
    public ApiResponse<?> highlights(@RequestParam String ids) {
        return ApiResponse.ok(ai.highlights(CompareRules.parseIds(ids)));
    }
}
