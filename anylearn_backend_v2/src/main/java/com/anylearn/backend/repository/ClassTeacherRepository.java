package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ClassTeacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassTeacherRepository extends JpaRepository<ClassTeacher, Long> {

    @Query(value = """
        SELECT u.* FROM users u
        JOIN class_teachers ct ON ct.user_id = u.id AND ct.class_id = :classId
        WHERE u.user_id = :ownerId AND u.role = 'teacher'
        """, nativeQuery = true)
    List<java.util.Map<String, Object>> findTeachersByClassAndOwner(
            @Param("classId") Long classId, @Param("ownerId") Long ownerId);
}
