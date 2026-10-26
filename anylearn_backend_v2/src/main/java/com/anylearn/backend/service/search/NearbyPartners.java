package com.anylearn.backend.service.search;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/** Pure rules of the "Xem bản đồ" popup: which partner branches fall in the circle, and what text the small card shows. */
public final class NearbyPartners {

    public static final int MAX_PARTNERS = 100;
    public static final int INTRO_LENGTH = 140;
    private static final double KM_PER_DEGREE = 111.0;
    private static final Pattern TAGS = Pattern.compile("<[^>]*>");

    private NearbyPartners() {}

    /** A branch of a partner: where it is and what the partner is called. */
    public record Branch(long partnerId, String name, String image, String intro, double lat, double lng) {}

    /** The square around the point that holds the whole circle: {minLat, maxLat, minLng, maxLng}, a cheap first filter for SQL. */
    public static double[] boundingBox(double lat, double lng, double radiusKm) {
        double dLat = radiusKm / KM_PER_DEGREE;
        double dLng = radiusKm / (KM_PER_DEGREE * Math.max(Math.cos(Math.toRadians(lat)), 0.01));
        return new double[]{lat - dLat, lat + dLat, lng - dLng, lng + dLng};
    }

    /** One entry per partner (its nearest branch inside the circle), nearest first, at most {@link #MAX_PARTNERS}. */
    public static List<Map<String, Object>> inRadius(List<Branch> branches, double lat, double lng, double radiusKm) {
        Map<Long, Map<String, Object>> nearest = new LinkedHashMap<>();
        for (Branch branch : branches) {
            double km = Geo.distanceKm(lat, lng, branch.lat(), branch.lng());
            if (km > radiusKm) continue;
            Map<String, Object> current = nearest.get(branch.partnerId());
            if (current != null && ((Double) current.get("distanceKm")) <= km) continue;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", branch.partnerId());
            entry.put("name", branch.name());
            entry.put("image", branch.image());
            entry.put("intro", shortIntro(branch.intro()));
            entry.put("lat", branch.lat());
            entry.put("lng", branch.lng());
            entry.put("distanceKm", km);
            nearest.put(branch.partnerId(), entry);
        }
        List<Map<String, Object>> result = new ArrayList<>(nearest.values());
        result.sort(Comparator.comparingDouble(entry -> (Double) entry.get("distanceKm")));
        result.forEach(entry -> entry.put("distanceKm", Math.round((Double) entry.get("distanceKm") * 10) / 10.0));
        return result.size() > MAX_PARTNERS ? new ArrayList<>(result.subList(0, MAX_PARTNERS)) : result;
    }

    /** The introduction as plain text (the profile may hold HTML), cut at {@link #INTRO_LENGTH} characters with "…". */
    public static String shortIntro(String intro) {
        if (intro == null) return "";
        String text = TAGS.matcher(intro).replaceAll(" ").replace("&nbsp;", " ").replaceAll("\\s+", " ").trim();
        return text.length() <= INTRO_LENGTH ? text : text.substring(0, INTRO_LENGTH).trim() + "…";
    }
}
