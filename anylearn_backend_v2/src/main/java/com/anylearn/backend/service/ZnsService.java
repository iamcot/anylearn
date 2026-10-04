package com.anylearn.backend.service;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ZnsService {

    private static final String TOKEN_CONFIG_KEY = "ZNS_TOKEN";
    private static final String ZNS_SEND_URL = "https://business.openapi.zalo.me/message/template";
    private static final String OAUTH_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
    private static final String OAUTH_AUTHORIZE_URL = "https://oauth.zaloapp.com/v4/oa/permission";

    @Value("${zalo.zns.appId:}")
    private String appId;

    @Value("${zalo.zns.appSecret:}")
    private String appSecret;

    @Value("${zalo.zns.redirectUri:}")
    private String redirectUri;

    @Value("${zalo.zns.codeChallenge:}")
    private String codeChallenge;

    @Value("${zalo.zns.codeVerifier:}")
    private String codeVerifier;

    @Value("${zalo.zns.otpTemplateId:}")
    private String otpTemplateId;

    @Value("${zalo.zns.testMode:true}")
    private boolean testMode;

    private final ConfigurationRepository configurationRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getAuthorizeUrl() {
        return OAUTH_AUTHORIZE_URL
                + "?app_id=" + appId
                + "&redirect_uri=" + redirectUri
                + "&code_challenge=" + codeChallenge;
    }

    public void exchangeCodeForToken(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("secret_key", appSecret);

            String body = "code=" + code
                    + "&app_id=" + appId
                    + "&grant_type=authorization_code"
                    + "&code_verifier=" + codeVerifier;

            ResponseEntity<String> response = restTemplate.exchange(
                    OAUTH_TOKEN_URL, HttpMethod.POST,
                    new HttpEntity<>(body, headers), String.class);

            saveToken(response.getBody());
            log.info("ZNS token exchanged successfully");
        } catch (Exception e) {
            log.error("Failed to exchange ZNS token: {}", e.getMessage());
            throw new RuntimeException("ZNS token exchange failed", e);
        }
    }

    private void refreshAccessToken(String refreshToken) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("secret_key", appSecret);

        String body = "refresh_token=" + refreshToken
                + "&app_id=" + appId
                + "&grant_type=refresh_token";

        ResponseEntity<String> response = restTemplate.exchange(
                OAUTH_TOKEN_URL, HttpMethod.POST,
                new HttpEntity<>(body, headers), String.class);

        saveToken(response.getBody());
        log.info("ZNS token refreshed successfully");
    }

    private void saveToken(String jsonBody) throws Exception {
        Map<String, Object> tokenMap = objectMapper.readValue(jsonBody, new TypeReference<>() {});
        Configuration config = configurationRepository.findByKey(TOKEN_CONFIG_KEY)
                .orElse(new Configuration());
        config.setKey(TOKEN_CONFIG_KEY);
        config.setValue(objectMapper.writeValueAsString(tokenMap));
        config.setType("system");
        config.setUpdatedAt(LocalDateTime.now());
        if (config.getCreatedAt() == null) config.setCreatedAt(LocalDateTime.now());
        configurationRepository.save(config);
    }

    private String getValidAccessToken() throws Exception {
        Configuration config = configurationRepository.findByKey(TOKEN_CONFIG_KEY)
                .orElseThrow(() -> new RuntimeException("ZNS token not configured. Call /admin/zns/authorize first."));

        Map<String, Object> tokenMap = objectMapper.readValue(config.getValue(), new TypeReference<>() {});
        String accessToken = (String) tokenMap.get("access_token");
        String refreshToken = (String) tokenMap.get("refresh_token");
        Object expiresInObj = tokenMap.get("expires_in");

        if (expiresInObj != null) {
            long expiresIn = Long.parseLong(expiresInObj.toString());
            LocalDateTime updatedAt = config.getUpdatedAt() != null ? config.getUpdatedAt() : LocalDateTime.now();
            if (LocalDateTime.now().isAfter(updatedAt.plusSeconds(expiresIn - 300))) {
                log.info("ZNS access token expiring soon, refreshing...");
                refreshAccessToken(refreshToken);
                config = configurationRepository.findByKey(TOKEN_CONFIG_KEY).orElseThrow();
                tokenMap = objectMapper.readValue(config.getValue(), new TypeReference<>() {});
                accessToken = (String) tokenMap.get("access_token");
            }
        }
        return accessToken;
    }

    public void sendOtp(String phone, String otpCode) throws Exception {
        sendTemplate(phone, otpTemplateId, Map.of("otp", otpCode));
    }

    public void sendTemplate(String phone, String templateId, Map<String, String> data) throws Exception {
        if (appId == null || appId.isBlank()) {
            log.warn("[ZNS STUB] Would send template {} to {}: {}", templateId, phone, data);
            return;
        }

        String accessToken = getValidAccessToken();
        String normalizedPhone = normalizePhone(phone);

        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("phone", normalizedPhone);
        payload.put("template_id", templateId);
        payload.put("template_data", data);
        if (testMode) payload.put("mode", "development");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("access_token", accessToken);

        ResponseEntity<String> response = restTemplate.exchange(
                ZNS_SEND_URL, HttpMethod.POST,
                new HttpEntity<>(objectMapper.writeValueAsString(payload), headers),
                String.class);

        log.debug("ZNS send response: {}", response.getBody());

        Map<String, Object> result = objectMapper.readValue(response.getBody(), new TypeReference<>() {});
        Number errorCode = (Number) result.get("error");
        if (errorCode != null && errorCode.intValue() != 0) {
            throw new RuntimeException("ZNS error " + errorCode + ": " + result.get("message"));
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) return phone;
        phone = phone.replaceAll("[^0-9]", "");
        if (phone.startsWith("0")) phone = "84" + phone.substring(1);
        if (!phone.startsWith("84")) phone = "84" + phone;
        return phone;
    }
}
