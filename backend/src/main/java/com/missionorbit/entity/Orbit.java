package com.missionorbit.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "orbits")
public class Orbit {
    @Id
    @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "altitude_label", nullable = false, length = 64)
    private String altitudeLabel;
    @Column(name = "inclination_label", nullable = false, length = 64)
    private String inclinationLabel;
    @Column(name = "compatible_destinations_csv", nullable = false, length = 120)
    private String compatibleDestinationsCsv;
    @Column(name = "science_multiplier", nullable = false, precision = 4, scale = 2)
    private BigDecimal scienceMultiplier;
    @Column(name = "power_sunlit_ratio", nullable = false, precision = 4, scale = 2)
    private BigDecimal powerSunlitRatio;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getAltitudeLabel() { return altitudeLabel; }
    public String getInclinationLabel() { return inclinationLabel; }
    public String getCompatibleDestinationsCsv() { return compatibleDestinationsCsv; }
    public BigDecimal getScienceMultiplier() { return scienceMultiplier; }
    public BigDecimal getPowerSunlitRatio() { return powerSunlitRatio; }
    public String getDescription() { return description; }
}
