package com.anylearn.backend.repository;

import com.anylearn.backend.entity.OrderFollowup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderFollowupRepository extends JpaRepository<OrderFollowup, Long> {

    List<OrderFollowup> findByOrderId(Long orderId);
}
