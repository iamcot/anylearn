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
        String image,
        String dateStart
) {}
