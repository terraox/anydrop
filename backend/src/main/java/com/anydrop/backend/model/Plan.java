package com.anydrop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "plans")
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String name; // "SCOUT", "TITAN"

    private long speedLimit; // in bytes per second. -1 for unlimited? or high number.
    private long fileSizeLimit; // in bytes.

    // Pre-defined plans logic could be here or in service initialization
}
