package com.anylearn.backend.repository;

import com.anylearn.backend.entity.CourseSeries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseSeriesRepository extends JpaRepository<CourseSeries, Long> {
}
