package com.missionorbit.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "launch_vehicles")
public class LaunchVehicle {
    @Id
    @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "payload_capacity_kg", nullable = false)
    private int payloadCapacityKg;
    @Column(name = "launch_cost_m", nullable = false)
    private int launchCostM;
    @Column(name = "compatible_destinations_csv", nullable = false, length = 120)
    private String compatibleDestinationsCsv;
    @Column(name = "reliability_rating", nullable = false)
    private int reliabilityRating;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    public String getId() { return id; }
    public String getName() { return name; }
    public int getPayloadCapacityKg() { return payloadCapacityKg; }
    public int getLaunchCostM() { return launchCostM; }
    public String getCompatibleDestinationsCsv() { return compatibleDestinationsCsv; }
    public int getReliabilityRating() { return reliabilityRating; }
    public String getSummary() { return summary; }
}
