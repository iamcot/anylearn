package com.anylearn.backend.repository;

import com.anylearn.backend.entity.UserLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {

    List<UserLocation> findByUserIdAndStatus(Long userId, Byte status);

    List<UserLocation> findByUserIdAndPlaceIdAndStatus(Long userId, String placeId, Byte status);

    @Query("SELECT DISTINCT ul.provinceCode FROM UserLocation ul WHERE ul.userId = :userId AND ul.status = 1 AND ul.provinceCode IS NOT NULL")
    List<String> findProvinceCodesByUserId(@Param("userId") Long userId);
}
