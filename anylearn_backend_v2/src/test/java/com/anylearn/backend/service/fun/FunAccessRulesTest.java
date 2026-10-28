package com.anylearn.backend.service.fun;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FunAccessRulesTest {

    @Test
    void phonesAreCleaned() {
        assertEquals("0912345678", FunAccessRules.cleanPhone("+84 912 345 678"));
        assertEquals("", FunAccessRules.cleanPhone("12"));
        assertEquals(List.of("0912345678", "0987654321"), FunAccessRules.parsePhones("0912345678, 84987654321\n0912345678"));
    }

    @Test
    void modesDecideWhoGetsIn() {
        List<String> testers = List.of("0912345678");
        assertTrue(FunAccessRules.allowed("all", false, "0900000000", testers));
        assertTrue(FunAccessRules.allowed("testers", false, "+84912345678", testers));
        assertFalse(FunAccessRules.allowed("testers", false, "0900000000", testers));
        assertFalse(FunAccessRules.allowed("off", false, "0912345678", testers));
        assertTrue(FunAccessRules.allowed("off", true, null, testers));
        assertTrue(FunAccessRules.allowed("nonsense", false, "0900000000", testers));
    }
}
