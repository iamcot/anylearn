package com.anylearn.backend.dto;

public record UserSearchDocument(
        Long id,
        String name,
        String role,
        String title,
        String introduce,
        String image,
        String banner,
        int isHot,
        int boostScore,
        int status,
        int isTest,
        Double rating
) {}
