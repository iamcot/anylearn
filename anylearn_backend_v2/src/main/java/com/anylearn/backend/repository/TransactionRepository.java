package com.anylearn.backend.repository;

import com.anylearn.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.type IN :types ORDER BY t.id DESC")
    List<Transaction> findByUserIdAndTypeIn(@Param("userId") Long userId, @Param("types") List<String> types);

    @Query("SELECT t FROM Transaction t WHERE t.orderId = :orderId AND t.type = :type ORDER BY t.id DESC")
    List<Transaction> findByOrderIdAndType(@Param("orderId") Long orderId, @Param("type") String type);

    // Find pending commission/partner transactions for a list of order_detail IDs
    @Query("SELECT t FROM Transaction t WHERE t.orderId IN :detailIds AND t.type IN ('partner','commission') AND t.status = 0")
    List<Transaction> findPendingCommissionsByDetailIds(@Param("detailIds") List<Long> detailIds);
}
