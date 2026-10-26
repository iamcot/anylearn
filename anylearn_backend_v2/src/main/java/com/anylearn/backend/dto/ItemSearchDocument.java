package com.anylearn.backend.dto;

import java.util.List;
import java.util.Map;

public record ItemSearchDocument(
        Long id,
        String title,
        String type,
        String subtype,
        String shortContent,
        String content,
        String tags,
        String authorName,
        String authorImage,
        Long authorId,
        List<String> authorProvinceCodes,
        String categoryTitles,
        List<String> categoryUrls,
        Long price,
        Integer agesMin,
        Integer agesMax,
        int status,
        int userStatus,
        int isHot,
        int boostScore,
        int popularityScore,
        String image,
        String dateStart,
        List<String> districtCodes,
        @com.fasterxml.jackson.annotation.JsonProperty("_geo") @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL) Map<String, Double> geo,
        List<Map<String, Object>> locations,
        List<String> timeSlots,
        String partnerType,
        boolean hasFreeTrial,
        boolean onSale,
        List<Long> tagIds,
        Long pricePerSession,
        Integer nextStartDay,
        // 1 when the partner is an active member with a signed contract, 0 otherwise (courses of others are never shown)
        int authorLive
) {}
