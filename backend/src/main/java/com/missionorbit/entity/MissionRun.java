package com.missionorbit.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "mission_runs")
public class MissionRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "mission_id", nullable = false, length = 64)
    private String missionId;
    @Column(name = "spacecraft_id", nullable = false)
    private Long spacecraftId;
    @Column(name = "launch_vehicle_id", nullable = false, length = 64)
    private String launchVehicleId;
    @Column(name = "orbit_id", nullable = false, length = 64)
    private String orbitId;
    @Column(name = "selected_objectives_csv", nullable = false)
    private String selectedObjectivesCsv;
    @Column(name = "executed_at", nullable = false, updatable = false)
    private Instant executedAt = Instant.now();

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getMissionId() { return missionId; }
    public void setMissionId(String missionId) { this.missionId = missionId; }
    public Long getSpacecraftId() { return spacecraftId; }
    public void setSpacecraftId(Long spacecraftId) { this.spacecraftId = spacecraftId; }
    public String getLaunchVehicleId() { return launchVehicleId; }
    public void setLaunchVehicleId(String launchVehicleId) { this.launchVehicleId = launchVehicleId; }
    public String getOrbitId() { return orbitId; }
    public void setOrbitId(String orbitId) { this.orbitId = orbitId; }
    public String getSelectedObjectivesCsv() { return selectedObjectivesCsv; }
    public void setSelectedObjectivesCsv(String selectedObjectivesCsv) { this.selectedObjectivesCsv = selectedObjectivesCsv; }
    public Instant getExecutedAt() { return executedAt; }
}
