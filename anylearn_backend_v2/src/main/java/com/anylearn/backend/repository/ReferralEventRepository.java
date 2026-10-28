package com.anylearn.backend.repository;

import com.anylearn.backend.entity.ReferralEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralEventRepository extends JpaRepository<ReferralEvent, Long> {
}
