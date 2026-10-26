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

    /** Addresses a course is taught at (table item_locations); empty for courses that only use `items.user_location_id`. */
    @Query(value = "SELECT user_location_id FROM item_locations WHERE item_id = :itemId ORDER BY user_location_id", nativeQuery = true)
    List<Long> findItemAddressIds(@Param("itemId") Long itemId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "DELETE FROM item_locations WHERE item_id = :itemId", nativeQuery = true)
    void deleteItemAddresses(@Param("itemId") Long itemId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "INSERT IGNORE INTO item_locations (item_id, user_location_id) VALUES (:itemId, :locationId)", nativeQuery = true)
    void addItemAddress(@Param("itemId") Long itemId, @Param("locationId") Long locationId);
}
