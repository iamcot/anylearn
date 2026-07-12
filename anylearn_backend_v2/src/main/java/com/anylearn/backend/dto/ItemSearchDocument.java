package com.anylearn.backend.dto;

import java.util.List;

public record ItemSearchDocument(
        Long id,
        String title,
        String type,
        String subtype,
        String shortContent,
        String content,
        String tags,
        String authorName,
        String categoryTitles,
        List<String> categoryUrls,
        Long price,
        int status,
        int userStatus,
        int isHot,
        int boostScore,
        String image,
        String dateStart
) {}
