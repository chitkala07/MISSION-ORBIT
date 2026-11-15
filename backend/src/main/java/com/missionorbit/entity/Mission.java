package com.missionorbit.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "missions")
public class Mission {
    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "destination_id", nullable = false, length = 32)
    private String destinationId;

    @Column(name = "destination_name", nullable = false, length = 64)
    private String destinationName;

    @Column(nullable = false, length = 20)
    private String difficulty;

    @Column(name = "estimated_duration_days", nullable = false)
    private int estimatedDurationDays;

    @Column(name = "budget_limit_m", nullable = false)
    private int budgetLimitM;

    @Column(name = "mass_limit_kg", nullable = false)
    private int massLimitKg;

    @Column(name = "min_comms_capacity", nullable = false)
    private int minCommsCapacity;

    @Column(name = "solar_efficiency_factor", nullable = false, precision = 4, scale = 2)
    private BigDecimal solarEfficiencyFactor;

    @Column(name = "requires_landing_system", nullable = false)
    private boolean requiresLandingSystem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDestinationId() { return destinationId; }
    public String getDestinationName() { return destinationName; }
    public String getDifficulty() { return difficulty; }
    public int getEstimatedDurationDays() { return estimatedDurationDays; }
    public int getBudgetLimitM() { return budgetLimitM; }
    public int getMassLimitKg() { return massLimitKg; }
    public int getMinCommsCapacity() { return minCommsCapacity; }
    public BigDecimal getSolarEfficiencyFactor() { return solarEfficiencyFactor; }
    public boolean isRequiresLandingSystem() { return requiresLandingSystem; }
    public String getDescription() { return description; }
}
