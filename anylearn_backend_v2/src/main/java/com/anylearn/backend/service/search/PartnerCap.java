package com.anylearn.backend.service.search;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Keeps at most `cap` courses of one partner in a result list (order kept), so a big partner does not fill the page. */
public final class PartnerCap {

    private PartnerCap() {}

    /** Hits are index documents with an `authorId`; a hit without one is never dropped. `cap <= 0` keeps everything. */
    public static List<Map<String, Object>> limitPerPartner(List<Map<String, Object>> hits, int cap) {
        if (cap <= 0) return hits;
        Map<Long, Integer> seen = new HashMap<>();
        List<Map<String, Object>> kept = new ArrayList<>();
        for (Map<String, Object> hit : hits) {
            if (!(hit.get("authorId") instanceof Number author)) { kept.add(hit); continue; }
            if (seen.merge(author.longValue(), 1, Integer::sum) <= cap) kept.add(hit);
        }
        return kept;
    }
}
