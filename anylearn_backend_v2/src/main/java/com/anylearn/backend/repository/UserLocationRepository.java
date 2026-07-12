package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {

    @Query("SELECT DISTINCT ul.provinceCode FROM UserLocation ul WHERE ul.userId = :userId AND ul.status = 1")
    List<String> findProvinceCodesByUserId(@Param("userId") Long userId);
}
