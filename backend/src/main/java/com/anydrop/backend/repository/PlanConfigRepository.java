package com.anydrop.backend.repository;

import com.anydrop.backend.model.PlanConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanConfigRepository extends JpaRepository<PlanConfig, Long> {
    Optional<PlanConfig> findByPlanName(String planName);
}
