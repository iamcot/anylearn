package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Contract;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    /** A partner's contracts that have an address, the approved one first, then the signed one, then the newest. */
    @Query("SELECT c FROM Contract c WHERE c.userId = :userId AND c.status <> 0 AND c.address IS NOT NULL AND c.address <> '' "
            + "ORDER BY CASE WHEN c.status = 99 THEN 0 WHEN c.status = 10 THEN 1 ELSE 2 END, c.id DESC")
    List<Contract> findWithAddress(@Param("userId") Long userId, Pageable pageable);

    /** Active partners with a signed or approved contract that has an address, and no address of their own yet. */
    @Query(value = """
            SELECT u.id AS userId, u.name AS name, u.phone AS phone, u.role AS role, c.address AS address, c.status AS status
            FROM users u
            JOIN contracts c ON c.id = (
                SELECT c2.id FROM contracts c2
                WHERE c2.user_id = u.id AND c2.status IN (10, 99) AND c2.address IS NOT NULL AND TRIM(c2.address) <> ''
                ORDER BY (c2.status = 99) DESC, c2.id DESC LIMIT 1)
            WHERE u.status = 1
              AND NOT EXISTS (SELECT 1 FROM user_locations ul WHERE ul.user_id = u.id AND ul.status = 1)
            ORDER BY u.id LIMIT :limit
            """, nativeQuery = true)
    List<java.util.Map<String, Object>> findImportCandidates(@Param("limit") int limit);

    /** The address of the partner's signed or approved contract (approved first); empty when there is none. */
    @Query(value = """
            SELECT TRIM(c.address) FROM contracts c
            WHERE c.user_id = :userId AND c.status IN (10, 99) AND c.address IS NOT NULL AND TRIM(c.address) <> ''
            ORDER BY (c.status = 99) DESC, c.id DESC LIMIT 1
            """, nativeQuery = true)
    List<String> findSignedAddress(@Param("userId") Long userId);
}
