package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserCourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserCourseEnrollmentRepository extends JpaRepository<UserCourseEnrollment, Long> {

    @Query(value = """
        SELECT uce.id, uce.user_id, uce.item_id, uce.order_id, uce.schedule_id,
               uce.start_date, uce.end_date, uce.billing_period, uce.status,
               isc.schedule_type, isc.weekdays, isc.time_start, isc.time_end,
               isc.date_start, isc.date_end, isc.event_date,
               isc.title AS schedule_title,
               isc.duration_value, isc.duration_unit,
               i.title AS item_title, i.image AS item_image, i.seo_url
        FROM user_course_enrollments uce
        LEFT JOIN item_schedules isc ON isc.id = uce.schedule_id
        JOIN items i ON i.id = uce.item_id
        WHERE uce.user_id = :userId AND uce.status IN ('active','pending')
        ORDER BY uce.created_at DESC
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findEnrollmentsWithScheduleByUserId(@Param("userId") Long userId);

    @Query(value = """
        SELECT uce.id, uce.user_id, uce.item_id, uce.schedule_id,
               uce.start_date, uce.end_date, uce.status,
               isc.schedule_type, isc.weekdays, isc.time_start, isc.time_end,
               isc.date_start, isc.date_end, isc.event_date,
               i.title AS item_title
        FROM user_course_enrollments uce
        LEFT JOIN item_schedules isc ON isc.id = uce.schedule_id
        JOIN items i ON i.id = uce.item_id
        WHERE uce.status = 'active' AND uce.schedule_id IS NOT NULL
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findAllActiveEnrollmentsWithSchedule();

    @Query(value = """
        SELECT uce.id, uce.user_id, uce.item_id, uce.schedule_id, uce.created_at,
               isc.schedule_type,
               i.title AS item_title
        FROM user_course_enrollments uce
        LEFT JOIN item_schedules isc ON isc.id = uce.schedule_id
        JOIN items i ON i.id = uce.item_id
        WHERE uce.status = 'pending'
          AND isc.schedule_type = 'open'
          AND uce.start_date IS NULL
          AND uce.created_at < NOW() - INTERVAL 24 HOUR
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findPendingOpenEnrollments();

    @Query(value = """
        SELECT uce.id, uce.user_id, uce.item_id, uce.end_date,
               i.title AS item_title
        FROM user_course_enrollments uce
        JOIN items i ON i.id = uce.item_id
        WHERE uce.status = 'active'
          AND uce.end_date BETWEEN :tomorrow AND DATE_ADD(:tomorrow, INTERVAL 7 DAY)
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findEnrollmentsEndingSoon(@Param("tomorrow") java.time.LocalDate tomorrow);
}
