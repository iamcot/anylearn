package com.anylearn.backend.service.insights;

/** Body of POST /api/course-requests: what a visitor wants us to find. */
public record CourseRequestInput(String name, String phone, String subject, Integer learnerAge, String provinceCode,
                                 String districtText, Long budgetMax, String preferredTime, String mode, String note,
                                 String sourceRef) {}
