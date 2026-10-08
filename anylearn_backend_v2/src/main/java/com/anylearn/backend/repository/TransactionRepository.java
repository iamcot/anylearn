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

    // Find pending partner/commission/foundation/net_revenue transactions for a list of order_detail IDs
    @Query("SELECT t FROM Transaction t WHERE t.orderId IN :detailIds AND t.type IN ('partner','commission','foundation','net_revenue') AND t.status = 0")
    List<Transaction> findPendingCommissionsByDetailIds(@Param("detailIds") List<Long> detailIds);

    // Paginated history for a user, all types, newest first
    @Query(value = "SELECT * FROM transactions WHERE user_id = :userId ORDER BY id DESC LIMIT :size OFFSET :offset", nativeQuery = true)
    List<Transaction> findByUserIdOrderedPaged(@Param("userId") Long userId, @Param("size") int size, @Param("offset") long offset);

    // For admin: filter by type and/or status and/or userId
    @Query(value = "SELECT * FROM transactions " +
                   "WHERE (:userId IS NULL OR user_id = :userId) " +
                   "AND (:type IS NULL OR type = :type) " +
                   "AND (:status IS NULL OR status = :status) " +
                   "ORDER BY id DESC LIMIT :size OFFSET :offset", nativeQuery = true)
    List<Transaction> findForAdmin(
            @Param("userId") Long userId, @Param("type") String type,
            @Param("status") Integer status, @Param("size") int size, @Param("offset") long offset);

    @Query(value = "SELECT COUNT(*) FROM transactions " +
                   "WHERE (:userId IS NULL OR user_id = :userId) " +
                   "AND (:type IS NULL OR type = :type) " +
                   "AND (:status IS NULL OR status = :status)", nativeQuery = true)
    long countForAdmin(@Param("userId") Long userId, @Param("type") String type, @Param("status") Integer status);

    List<Transaction> findByUserIdAndStatus(Long userId, int status);
}
