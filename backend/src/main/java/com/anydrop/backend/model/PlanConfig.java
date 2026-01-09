package com.anydrop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plan_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String planName; // "FREE", "PRO"

    @Column(nullable = false)
    private Long maxFileSizeMB; // Maximum file size in MB

    @Column(nullable = false)
    private Integer dailyTransferLimit; // -1 for unlimited

    @Column(nullable = false)
    private Long storageLimitGB; // Storage limit in GB

    @Column(nullable = false)
    private Boolean priorityProcessing = false; // Only for PRO

    @Column(nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(nullable = false)
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
