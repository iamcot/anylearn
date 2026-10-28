package com.anylearn.backend.service.video;

import com.anylearn.backend.service.explore.BunnyRules;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bunny Stream library of the paid video courses (plan 17). It is a separate library from the Khám phá clips, with
 * Token Authentication switched on, so a lesson plays only through a link this server signed for a few hours
 * ({@link VideoCourseRules#signedUrl}). Settings `app.bunny-course.*` (`BUNNY_COURSE_*`); when they are empty the
 * Khám phá library is used without signing (fine for development, never for paid lessons in production).
 */
@lombok.extern.slf4j.Slf4j
@Component
public class CourseVideoClient {

    static final String API_BASE = "https://video.bunnycdn.com";
    static final String TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

    private final RestTemplate http;
    private final String libraryId;
    private final String apiKey;
    private final String cdnHost;
    private final String tokenKey;

    public CourseVideoClient(RestTemplateBuilder builder,
                             @Value("${app.bunny-course.library-id:}") String libraryId,
                             @Value("${app.bunny-course.api-key:}") String apiKey,
                             @Value("${app.bunny-course.cdn-host:}") String cdnHost,
                             @Value("${app.bunny-course.token-key:}") String tokenKey,
                             @Value("${app.bunny.library-id:}") String exploreLibraryId,
                             @Value("${app.bunny.api-key:}") String exploreApiKey,
                             @Value("${app.bunny.cdn-host:}") String exploreCdnHost) {
        this.http = builder.connectTimeout(Duration.ofSeconds(5)).readTimeout(Duration.ofSeconds(15)).build();
        boolean own = libraryId != null && !libraryId.isBlank();
        this.libraryId = trim(own ? libraryId : exploreLibraryId);
        this.apiKey = trim(own ? apiKey : exploreApiKey);
        this.cdnHost = BunnyRules.cleanHost(own ? cdnHost : exploreCdnHost);
        this.tokenKey = own ? trim(tokenKey) : "";
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    public boolean isEnabled() {
        return !libraryId.isEmpty() && !apiKey.isEmpty() && !cdnHost.isEmpty();
    }

    /** Whether play links are signed (the course library with a token key is configured). */
    public boolean isSigned() {
        return isEnabled() && !tokenKey.isEmpty();
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("AccessKey", apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    /** Creates the video on Bunny and returns what the browser needs for the TUS upload. */
    public Map<String, Object> createUpload(String title) {
        if (!isEnabled()) throw new IllegalStateException("Chưa cấu hình Bunny Stream cho khóa học video");
        JsonNode answer = http.exchange(API_BASE + "/library/" + libraryId + "/videos", HttpMethod.POST,
                new HttpEntity<>(Map.of("title", BunnyRules.cleanTitle(title)), headers()), JsonNode.class).getBody();
        String videoId = answer == null ? null : answer.path("guid").asText(null);
        if (videoId == null || videoId.isBlank()) throw new IllegalStateException("Bunny không trả về mã video");
        long expire = System.currentTimeMillis() / 1000 + BunnyRules.UPLOAD_VALID_SECONDS;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("endpoint", TUS_ENDPOINT);
        out.put("videoId", videoId);
        out.put("libraryId", libraryId);
        out.put("authorizationSignature", BunnyRules.signature(libraryId, apiKey, expire, videoId));
        out.put("authorizationExpire", expire);
        return out;
    }

    /** Bunny's state and length of a video: {status (ours), durationSeconds}, or null when Bunny cannot be asked. */
    public Map<String, Object> info(String videoId) {
        if (!isEnabled() || videoId == null) return null;
        try {
            JsonNode v = http.exchange(API_BASE + "/library/" + libraryId + "/videos/" + videoId, HttpMethod.GET,
                    new HttpEntity<>(headers()), JsonNode.class).getBody();
            if (v == null) return null;
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", VideoCourseRules.videoStatus(v.path("status").asInt(-1)));
            int length = v.path("length").asInt(0);
            out.put("durationSeconds", length > 0 ? length : null);
            return out;
        } catch (Exception e) {
            log.warn("Bunny video {} not read: {}", videoId, e.getMessage());
            return null;
        }
    }

    /** Deletes a video of this library. Never throws: a failure is only logged. */
    public void delete(String videoId) {
        if (!isEnabled() || videoId == null || videoId.isBlank()) return;
        try {
            http.exchange(API_BASE + "/library/" + libraryId + "/videos/" + videoId, HttpMethod.DELETE, new HttpEntity<>(headers()), String.class);
        } catch (Exception e) {
            log.warn("Bunny video {} not deleted: {}", videoId, e.getMessage());
        }
    }

    /** Playlist link of a video, signed for `hours` when the library uses tokens. */
    public String playUrl(String videoId, int hours) {
        return url(videoId, "playlist.m3u8", hours);
    }

    public String posterUrl(String videoId, int hours) {
        return url(videoId, "thumbnail.jpg", hours);
    }

    private String url(String videoId, String file, int hours) {
        if (videoId == null || cdnHost.isEmpty()) return null;
        if (tokenKey.isEmpty()) return "https://" + cdnHost + "/" + videoId + "/" + file;
        long expires = System.currentTimeMillis() / 1000 + hours * 3600L;
        return VideoCourseRules.signedUrl(cdnHost, tokenKey, videoId, file, expires);
    }
}
