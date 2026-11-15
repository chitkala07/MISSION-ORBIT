package com.missionorbit.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "components")
public class ComponentCatalog {
    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(name = "mass_kg", nullable = false)
    private int massKg;

    @Column(name = "power_draw_w", nullable = false)
    private int powerDrawW;

    @Column(name = "power_gen_w", nullable = false)
    private int powerGenW;

    @Column(name = "cost_m", nullable = false)
    private int costM;

    @Column(name = "science_value", nullable = false)
    private int scienceValue;

    @Column(name = "comms_capacity", nullable = false)
    private int commsCapacity;

    @Column(name = "max_quantity", nullable = false)
    private int maxQuantity;

    @Column(name = "short_explanation", nullable = false, columnDefinition = "TEXT")
    private String shortExplanation;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public int getMassKg() { return massKg; }
    public int getPowerDrawW() { return powerDrawW; }
    public int getPowerGenW() { return powerGenW; }
    public int getCostM() { return costM; }
    public int getScienceValue() { return scienceValue; }
    public int getCommsCapacity() { return commsCapacity; }
    public int getMaxQuantity() { return maxQuantity; }
    public String getShortExplanation() { return shortExplanation; }
}
