package com.anylearn.backend.service.pricing;

public record PriceReportInput(Long itemId, Long seenPrice, String seenPlace, String note, String phone) {}
