package com.anylearn.backend.service.insights;

/**
 * Who searched and how to find this search again: the browser makes {@code ref} per search, so a later click can say
 * which search it came from; {@code sessionKey} is a random id of the browser; audience/age come from the visitor's
 * "who is it for" answer.
 */
public record SearchContext(String ref, String sessionKey, String audience, Integer learnerAge, Long userId) {}
