package com.anylearn.backend.service.compare;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.repository.*;
import com.anylearn.backend.service.points.ItemPointsResolver;
import com.anylearn.backend.service.reviews.ReviewService;
import com.anylearn.backend.service.search.Geo;
import com.anylearn.backend.service.search.ItemSearchAttributes;
import com.anylearn.backend.service.search.SessionCounts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The figures of the comparison page (plan 04.6): only what the partner entered or the system counts, never a score.
 * A value that cannot be told is null and the page writes "Chưa có thông tin".
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CompareService {

    private final ItemRepository itemRepository;
    private final ItemScheduleRepository itemScheduleRepository;
    private final UserLocationRepository userLocationRepository;
    private final UserRepository userRepository;
    private final ReviewService reviewService;
    private final ItemPointsResolver pointsResolver;
    private final ItemCategoryRepository itemCategoryRepository;
    private final TagRepository tagRepository;

    /** One column per visible course, in the order the parent picked them. `lat`/`lng` (optional) give the distance. */
    public Map<String, Object> compare(List<Long> ids, Double lat, Double lng) {
        List<Item> items = ids.isEmpty() ? List.of()
                : itemRepository.findByIdsOrdered(ids, ids.stream().map(String::valueOf).collect(Collectors.joining(",")));
        List<Map<String, Object>> courses = new ArrayList<>();
        List<CompareRules.Topic> topics = new ArrayList<>();
        for (Item item : items) {
            try {
                Map<String, Object> col = column(item, lat, lng);
                CompareRules.Topic topic = topicOf(item);
                courses.add(col);
                topics.add(topic);
            } catch (RuntimeException e) {
                // One odd course must not blank the whole page.
                log.warn("Compare: course {} skipped: {}", item.getId(), e.toString());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("courses", courses);
        result.put("best", best(courses));
        CompareRules.FieldNotice notice = CompareRules.fieldNotice(topics);
        result.put("fieldNotice", notice == null ? null : notice.text());
        result.put("offField", notice == null ? List.of() : notice.off());
        result.put("mixedFormats", CompareRules.mixedFormats(courses.stream().map(c -> (String) c.get("subtype")).toList()));
        result.put("missing", ids.stream().filter(id -> courses.stream().noneMatch(c -> id.equals(c.get("id")))).toList());
        return result;
    }

    /** Categories (shown) and categories + tags (matched, lower case) of a course. */
    private CompareRules.Topic topicOf(Item item) {
        List<String> categories = itemCategoryRepository.findCategoriesByItemId(item.getId()).stream()
                .map(c -> String.valueOf(c.get("title"))).distinct().toList();
        Set<String> keys = new LinkedHashSet<>();
        categories.forEach(c -> keys.add(c.trim().toLowerCase(Locale.ROOT)));
        tagRepository.findActiveNamesByItemId(item.getId()).forEach(t -> keys.add(t.trim().toLowerCase(Locale.ROOT)));
        return new CompareRules.Topic(item.getTitle(), categories, keys);
    }

    private Map<String, Object> column(Item item, Double lat, Double lng) {
        List<ItemSchedule> schedules = itemScheduleRepository.findByItemIdAndStatus(item.getId(), (byte) 1);
        var branches = ItemSearchAttributes.activeBranchesOf(item, userLocationRepository.findItemAddressIds(item.getId()), schedules, userLocationRepository::findAllById);
        var partnerBranches = branches.isEmpty() && item.getUserId() != null
                ? userLocationRepository.findByUserIdAndStatus(item.getUserId(), (byte) 1) : List.<com.anylearn.backend.entity.UserLocation>of();
        var attributes = ItemSearchAttributes.derive(item, schedules, branches, partnerBranches, LocalDate.now());
        Integer sessions = SessionCounts.estimate(item.getCycleType(), item.getCycleAmount(), ItemSearchAttributes.weekdaysPerWeek(schedules));
        var summary = reviewService.summary(item.getId());

        Map<String, Object> col = new LinkedHashMap<>();
        col.put("id", item.getId());
        col.put("title", item.getTitle());
        col.put("image", item.getImage());
        col.put("seoUrl", item.getSeoUrl());
        col.put("subtype", item.getSubtype());
        col.put("categories", itemCategoryRepository.findCategoriesByItemId(item.getId()).stream().map(c -> String.valueOf(c.get("title"))).distinct().limit(3).toList());
        col.put("partnerId", item.getUserId());
        col.put("partnerName", item.getUserId() == null ? null : userRepository.findById(item.getUserId()).map(u -> u.getName()).orElse(null));
        col.put("price", item.getPrice());
        col.put("orgPrice", item.getOrgPrice() != null && item.getPrice() != null && item.getOrgPrice() > item.getPrice() ? item.getOrgPrice() : null);
        col.put("sessions", sessions);
        col.put("pricePerSession", attributes.pricePerSession());
        col.put("schedules", schedules.stream().map(s -> CompareRules.scheduleLine(s.getWeekdays(), s.getTimeStart(), s.getTimeEnd(), "open".equals(s.getScheduleType())))
                .filter(line -> !line.isEmpty()).distinct().limit(4).toList());
        col.put("dateStart", item.getDateStart() == null ? null : item.getDateStart().toString());
        col.put("ages", ages(item));
        col.put("distanceKm", distance(attributes.locations(), lat, lng));
        col.put("branchCount", attributes.locations().size());
        col.put("ratingAverage", summary.get("average"));
        col.put("ratingCount", summary.get("count"));
        col.put("freeTrial", attributes.hasFreeTrial());
        col.put("points", pointsResolver.buyerPoints(item));
        return col;
    }

    private static String ages(Item item) {
        Integer min = item.getAgesMin() == null ? null : item.getAgesMin().intValue();
        Integer max = item.getAgesMax() == null ? null : item.getAgesMax().intValue();
        if (min == null && max == null) return null;
        if (min != null && max != null) return min + "-" + max + " tuổi";
        return min != null ? "Từ " + min + " tuổi" : "Đến " + max + " tuổi";
    }

    private static Double distance(List<Map<String, Object>> locations, Double lat, Double lng) {
        if (lat == null || lng == null || locations.isEmpty()) return null;
        double nearest = Double.MAX_VALUE;
        for (Map<String, Object> branch : locations) {
            if (!(branch.get("lat") instanceof Number) || !(branch.get("lng") instanceof Number)) continue;
            nearest = Math.min(nearest, Geo.distanceKm(lat, lng, ((Number) branch.get("lat")).doubleValue(), ((Number) branch.get("lng")).doubleValue()));
        }
        return nearest == Double.MAX_VALUE ? null : Math.round(nearest * 10) / 10.0;
    }

    /** Per row, the index of the best figure (lowest price, nearest, most reviews are never ranked), only when it is a clear one. */
    private static Map<String, Integer> best(List<Map<String, Object>> courses) {
        Map<String, Integer> best = new LinkedHashMap<>();
        putBest(best, "price", courses, true);
        putBest(best, "pricePerSession", courses, true);
        putBest(best, "distanceKm", courses, true);
        putBest(best, "points", courses, false);
        return best;
    }

    private static void putBest(Map<String, Integer> best, String key, List<Map<String, Object>> courses, boolean lowerIsBetter) {
        List<Number> values = courses.stream().map(c -> (Number) c.get(key)).toList();
        Integer index = CompareRules.bestIndex(values, lowerIsBetter);
        if (index != null) best.put(key, index);
    }
}
