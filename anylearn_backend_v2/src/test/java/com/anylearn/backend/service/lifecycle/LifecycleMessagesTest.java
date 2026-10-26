package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.entity.ItemSchedule;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LifecycleMessagesTest {

    private static ItemSchedule schedule() {
        ItemSchedule schedule = new ItemSchedule();
        schedule.setGatherTime("17:15");
        schedule.setLocationNote("Phòng 302");
        schedule.setBringItems("Sách, bút");
        return schedule;
    }

    @Test
    void classDetailsSkipBlankParts() {
        assertEquals(List.of("Giờ tập trung: 17:15", "Địa điểm: Phòng 302", "Mang theo: Sách, bút"),
                LifecycleMessages.classDetails(schedule()));
        assertTrue(LifecycleMessages.classDetails(new ItemSchedule()).isEmpty());
        assertTrue(LifecycleMessages.classDetails(null).isEmpty());
    }

    @Test
    void startMessageSaysWhenAndWhatToBring() {
        String text = LifecycleMessages.startContent("Bin", "Piano", LocalDate.of(2026, 11, 2), "17:30", 1, schedule());
        assertTrue(text.contains("ngày mai"));
        assertTrue(text.contains("02/11, 17:30"));
        assertTrue(text.contains("Mang theo: Sách, bút"));
        assertEquals("Hôm nay khai giảng", LifecycleMessages.startTitle(0));
        assertEquals("Ngày mai khai giảng", LifecycleMessages.startTitle(1));
        assertEquals("Sắp khai giảng", LifecycleMessages.startTitle(3));
    }

    @Test
    void absentMessageIsGentleAndOffersLeave() {
        String text = LifecycleMessages.absentContent("Bin", "Piano", 2);
        assertTrue(text.contains("vắng 2 buổi liền"));
        assertTrue(text.contains("xin nghỉ hoặc đổi lịch"));
        assertFalse(text.toLowerCase().contains("nợ"));
    }

    @Test
    void feeMessageCountsDays() {
        assertTrue(LifecycleMessages.feeContent("Học phí T10", "Bin", "hết tháng 10", "Tháng 11", 3).contains("còn 3 ngày"));
        assertTrue(LifecycleMessages.feeContent("Học phí T10", "Bin", "hết tháng 10", "Tháng 11", 1).contains("hết hạn ngày mai"));
    }

    @Test
    void bonusSuffixOnlyWhenThereIsABonus() {
        assertEquals("", LifecycleMessages.bonusSuffix(0));
        assertTrue(LifecycleMessages.bonusSuffix(50).contains("50 anyPoint"));
    }
}
