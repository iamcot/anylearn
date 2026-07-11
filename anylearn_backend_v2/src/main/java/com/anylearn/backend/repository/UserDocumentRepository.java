package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserDocumentRepository extends JpaRepository<UserDocument, Long> {
}
