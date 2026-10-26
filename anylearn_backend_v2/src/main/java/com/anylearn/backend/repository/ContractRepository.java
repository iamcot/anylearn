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
}
