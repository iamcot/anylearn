package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ClassTeacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassTeacherRepository extends JpaRepository<ClassTeacher, Long> {
}
