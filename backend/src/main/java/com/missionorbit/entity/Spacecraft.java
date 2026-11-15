package com.missionorbit.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "spacecraft")
public class Spacecraft {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(name = "team_id")
    private Long teamId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "total_mass_kg", nullable = false)
    private int totalMassKg;

    @Column(name = "total_cost_m", nullable = false)
    private int totalCostM;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "spacecraft", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SpacecraftComponent> components = new ArrayList<>();

    public Long getId() { return id; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getTotalMassKg() { return totalMassKg; }
    public void setTotalMassKg(int totalMassKg) { this.totalMassKg = totalMassKg; }
    public int getTotalCostM() { return totalCostM; }
    public void setTotalCostM(int totalCostM) { this.totalCostM = totalCostM; }
    public List<SpacecraftComponent> getComponents() { return components; }
}
