package com.anylearn.backend.service.quiz;

import com.anylearn.backend.service.PersonNames;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.Pattern;

/** Pure rules of the rank quiz question bank (plan 14, phase 2). */
public final class QuizRules {

    private QuizRules() {}

    private static final ObjectMapper JSON = new ObjectMapper();

    public static final List<Integer> DIFFICULTIES = List.of(1, 2, 3, 4, 5);
    public static final Map<Integer, String> LEVEL_LABELS = Map.of(1, "Rất dễ", 2, "Dễ", 3, "Vừa", 4, "Khó", 5, "Rất khó");

    public record Rank(String key, String label) {}

    /** Ranks from the lowest; Huyền thoại has no ceiling. The game itself comes in phase 4. */
    public static final List<Rank> RANKS = List.of(
            new Rank("dong", "Đồng"), new Rank("bac", "Bạc"), new Rank("vang", "Vàng"), new Rank("bachkim", "Bạch kim"),
            new Rank("kimcuong", "Kim cương"), new Rank("thongthai", "Thông thái"), new Rank("sieupham", "Siêu phàm"),
            new Rank("huyenthoai", "Huyền thoại"));

    /** Share (percent) of questions of each difficulty 1..5 a rank gets; every row adds up to 100. */
    public static final Map<String, int[]> DEFAULT_MIX = new java.util.LinkedHashMap<>();
    static {
        DEFAULT_MIX.put("dong", new int[]{100, 0, 0, 0, 0});
        DEFAULT_MIX.put("bac", new int[]{80, 20, 0, 0, 0});
        DEFAULT_MIX.put("vang", new int[]{30, 50, 20, 0, 0});
        DEFAULT_MIX.put("bachkim", new int[]{10, 30, 50, 10, 0});
        DEFAULT_MIX.put("kimcuong", new int[]{0, 20, 40, 40, 0});
        DEFAULT_MIX.put("thongthai", new int[]{0, 10, 30, 40, 20});
        DEFAULT_MIX.put("sieupham", new int[]{0, 0, 20, 40, 40});
        DEFAULT_MIX.put("huyenthoai", new int[]{0, 0, 10, 30, 60});
    }

    private static final Pattern TOPIC_KEY = Pattern.compile("^[a-z0-9_]{2,30}$");

    public static final Set<String> STATUSES = Set.of("pending", "active", "hidden");

    /** Reports that hide a question until the team looks at it. */
    public static final int REPORT_HIDE_AT = 3;
    public static final int MAX_BODY = 300;
    public static final int MAX_OPTION = 120;
    public static final int MAX_EXPLANATION = 300;

    public record Candidate(String body, List<String> options, int correct, String explanation) {}

    /** Picks a difficulty (1..5) for one question: `roll` is a random number in [0, 1), `mix` the rank's percentages. */
    public static int pickDifficulty(int[] mix, double roll) {
        double point = roll * 100;
        double sum = 0;
        for (int i = 0; i < mix.length; i++) {
            sum += mix[i];
            if (point < sum) return i + 1;
        }
        for (int i = mix.length - 1; i >= 0; i--) if (mix[i] > 0) return i + 1;
        return 1;
    }

    /** Why a mix table cannot be saved, null when fine: every rank present, five whole numbers 0..100 adding up to 100. */
    public static String mixProblem(Map<String, int[]> mix) {
        for (Rank rank : RANKS) {
            int[] row = mix.get(rank.key());
            if (row == null || row.length != DIFFICULTIES.size()) return "Thiếu tỉ lệ cho rank " + rank.label();
            int sum = 0;
            for (int v : row) {
                if (v < 0 || v > 100) return "Tỉ lệ của rank " + rank.label() + " phải từ 0 đến 100";
                sum += v;
            }
            if (sum != 100) return "Tỉ lệ của rank " + rank.label() + " cộng lại phải bằng 100 (đang là " + sum + ")";
        }
        return null;
    }

    public static Map<String, int[]> parseMix(String json) {
        Map<String, int[]> out = new java.util.LinkedHashMap<>();
        try {
            JsonNode root = JSON.readTree(json);
            for (Rank rank : RANKS) {
                JsonNode row = root.path(rank.key());
                if (!row.isArray()) return null;
                int[] values = new int[row.size()];
                for (int i = 0; i < values.length; i++) values[i] = row.get(i).asInt(-1);
                out.put(rank.key(), values);
            }
        } catch (Exception e) {
            return null;
        }
        return mixProblem(out) == null ? out : null;
    }

    public static String mixToJson(Map<String, int[]> mix) {
        try {
            return JSON.writeValueAsString(mix);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Topic key from a label ("Xã hội & đời sống" -> "xa_hoi_doi_song"); empty when nothing usable is left. */
    public static String topicKeyFrom(String label) {
        String key = normalize(label).replace(' ', '_');
        return key.length() > 30 ? key.substring(0, 30) : key;
    }

    public static boolean validTopicKey(String key) {
        return key != null && TOPIC_KEY.matcher(key).matches();
    }

    public static String normalize(String text) {
        return PersonNames.normalize(text).replaceAll("[^\\p{L}\\p{N} ]", " ").replaceAll("\\s+", " ").trim();
    }

    public static String hash(String body) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(normalize(body).getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Word overlap (Jaccard) of two normalised questions; 0.8 and above counts as the same question. */
    public static double similarity(String a, String b) {
        Set<String> first = new HashSet<>(Arrays.asList(normalize(a).split(" ")));
        Set<String> second = new HashSet<>(Arrays.asList(normalize(b).split(" ")));
        first.remove("");
        second.remove("");
        if (first.isEmpty() || second.isEmpty()) return 0;
        Set<String> both = new HashSet<>(first);
        both.retainAll(second);
        Set<String> all = new HashSet<>(first);
        all.addAll(second);
        return (double) both.size() / all.size();
    }

    public static boolean isDuplicate(String body, Set<String> knownHashes, Collection<String> knownBodies) {
        if (knownHashes.contains(hash(body))) return true;
        for (String other : knownBodies) if (similarity(body, other) >= 0.8) return true;
        return false;
    }

    /** Why a candidate cannot be saved, null when it is fine. */
    public static String problem(Candidate c) {
        if (c == null || c.body() == null) return "Thiếu câu hỏi";
        String body = c.body().trim();
        if (body.length() < 10 || body.length() > MAX_BODY) return "Câu hỏi phải từ 10 đến " + MAX_BODY + " ký tự";
        if (c.options() == null || c.options().size() != 4) return "Cần đúng 4 đáp án";
        Set<String> seen = new HashSet<>();
        for (String option : c.options()) {
            if (option == null || option.isBlank() || option.trim().length() > MAX_OPTION) return "Đáp án trống hoặc quá dài";
            if (!seen.add(normalize(option))) return "Có hai đáp án giống nhau";
        }
        if (c.correct() < 0 || c.correct() > 3) return "Đáp án đúng phải là A, B, C hoặc D";
        if (c.explanation() != null && c.explanation().length() > MAX_EXPLANATION) return "Giải thích quá dài";
        return null;
    }

    /** Reads the `write_questions` tool answer; entries that fail {@link #problem} are counted in {@code invalid[0]}. */
    public static List<Candidate> parseQuestions(String json, int[] invalid) {
        List<Candidate> out = new ArrayList<>();
        try {
            for (JsonNode node : JSON.readTree(json).path("questions")) {
                List<String> options = new ArrayList<>();
                for (JsonNode o : node.path("options")) options.add(o.asText("").trim());
                Candidate c = new Candidate(node.path("body").asText("").trim(), options,
                        node.path("correct").asInt(-1), node.path("explanation").asText("").trim());
                if (problem(c) == null) out.add(c);
                else if (invalid != null) invalid[0]++;
            }
        } catch (Exception e) {
            // an unreadable answer gives no questions
        }
        return out;
    }

    /** Reads the `answer_questions` tool answer into index -> chosen option (0..3). */
    public static Map<Integer, Integer> parseAnswers(String json) {
        Map<Integer, Integer> out = new HashMap<>();
        try {
            for (JsonNode node : JSON.readTree(json).path("answers")) {
                int index = node.path("index").asInt(-1);
                int choice = node.path("choice").asInt(-1);
                if (index >= 0 && choice >= 0 && choice <= 3) out.put(index, choice);
            }
        } catch (Exception e) {
            // no answers
        }
        return out;
    }

    /** How many more questions a cell needs to reach its target (pending ones count, they are on the way). */
    public static int shortfall(int active, int pending, int target) {
        return Math.max(target - active - pending, 0);
    }

    public static double duplicateRate(long returned, long duplicates) {
        return returned <= 0 ? 0 : Math.round(1000.0 * duplicates / returned) / 1000.0;
    }

    public static String cellKey(String topic, int difficulty) {
        return topic + ":" + difficulty;
    }
}
