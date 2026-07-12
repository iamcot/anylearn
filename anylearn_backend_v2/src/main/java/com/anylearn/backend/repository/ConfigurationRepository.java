package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfigurationRepository extends JpaRepository<Configuration, String> {
    Optional<Configuration> findByKey(String key);
}
