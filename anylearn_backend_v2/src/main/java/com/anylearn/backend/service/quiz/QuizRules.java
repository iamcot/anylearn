package com.anylearn.backend.service.quiz;

import com.anylearn.backend.service.PersonNames;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/** Pure rules of the rank quiz question bank (plan 14, phase 2). */
public final class QuizRules {

    private QuizRules() {}

    private static final ObjectMapper JSON = new ObjectMapper();

    /** Topic key -> label. Keep in step with `anylearn_admin/src/pages/QuizBank.jsx`. */
    public static final Map<String, String> TOPICS = Map.of(
            "parenting", "Nuôi dạy con",
            "english", "Tiếng Anh",
            "music", "Âm nhạc",
            "art", "Mỹ thuật",
            "science", "Khoa học");
    public static final List<String> TOPIC_ORDER = List.of("parenting", "english", "music", "art", "science");
    public static final List<Integer> DIFFICULTIES = List.of(1, 2, 3);
    public static final Set<String> STATUSES = Set.of("pending", "active", "hidden");

    /** Reports that hide a question until the team looks at it. */
    public static final int REPORT_HIDE_AT = 3;
    public static final int MAX_BODY = 300;
    public static final int MAX_OPTION = 120;
    public static final int MAX_EXPLANATION = 300;

    public record Candidate(String body, List<String> options, int correct, String explanation) {}

    /** Rank index (0 = Đồng) -> difficulty: Đồng and Bạc easy, Vàng and Bạch kim medium, Kim cương and above hard. */
    public static int difficultyForRank(int rankIndex) {
        if (rankIndex <= 1) return 1;
        if (rankIndex <= 3) return 2;
        return 3;
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
