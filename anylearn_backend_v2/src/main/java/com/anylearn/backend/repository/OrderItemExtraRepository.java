package com.anylearn.backend.repository;

import com.anylearn.backend.entity.OrderItemExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemExtraRepository extends JpaRepository<OrderItemExtra, Long> {
}
