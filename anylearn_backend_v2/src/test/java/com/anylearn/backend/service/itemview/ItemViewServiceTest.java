package com.anylearn.backend.service.itemview;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class ItemViewServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
    private final ItemViewService service = new ItemViewService(jdbc,
            Clock.fixed(LocalDate.of(2026, 10, 27).atTime(10, 0).atZone(zone).toInstant(), zone));

    @Test
    void aVisitorWithoutAnAccountIsNotRecorded() {
        service.record(null, 5L);
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void anOpenIsOneUpsertPerPersonCourseAndDay() {
        service.record(3L, 5L);
        verify(jdbc).update(org.mockito.ArgumentMatchers.contains("ON DUPLICATE KEY UPDATE views = views + 1"),
                eq(3L), eq(Date.valueOf("2026-10-27")), any(), eq(5L));
    }

    @Test
    void pruneDeletesRowsOlderThanTheRetentionDays() {
        service.prune();
        verify(jdbc).update("DELETE FROM item_view_days WHERE day < ?", Date.valueOf(LocalDate.of(2026, 10, 27).minusDays(ItemViewService.KEEP_DAYS)));
    }
}
