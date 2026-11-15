package com.missionorbit.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "mission_results")
public class MissionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "mission_run_id", nullable = false, unique = true)
    private Long missionRunId;
    @Column(nullable = false, length = 32)
    private String outcome;
    @Column(name = "engineering_score", nullable = false)
    private int engineeringScore;
    @Column(name = "science_score", nullable = false)
    private int scienceScore;
    @Column(name = "resource_efficiency_score", nullable = false)
    private int resourceEfficiencyScore;
    @Column(name = "overall_score", nullable = false)
    private int overallScore;
    @Column(name = "recalculated_mass_kg", nullable = false)
    private int recalculatedMassKg;
    @Column(name = "recalculated_power_w", nullable = false)
    private int recalculatedPowerW;
    @Column(name = "recalculated_remaining_budget_m", nullable = false)
    private int recalculatedRemainingBudgetM;

    public Long getId() { return id; }
    public Long getMissionRunId() { return missionRunId; }
    public void setMissionRunId(Long missionRunId) { this.missionRunId = missionRunId; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public int getEngineeringScore() { return engineeringScore; }
    public void setEngineeringScore(int engineeringScore) { this.engineeringScore = engineeringScore; }
    public int getScienceScore() { return scienceScore; }
    public void setScienceScore(int scienceScore) { this.scienceScore = scienceScore; }
    public int getResourceEfficiencyScore() { return resourceEfficiencyScore; }
    public void setResourceEfficiencyScore(int resourceEfficiencyScore) { this.resourceEfficiencyScore = resourceEfficiencyScore; }
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    public int getRecalculatedMassKg() { return recalculatedMassKg; }
    public void setRecalculatedMassKg(int recalculatedMassKg) { this.recalculatedMassKg = recalculatedMassKg; }
    public int getRecalculatedPowerW() { return recalculatedPowerW; }
    public void setRecalculatedPowerW(int recalculatedPowerW) { this.recalculatedPowerW = recalculatedPowerW; }
    public int getRecalculatedRemainingBudgetM() { return recalculatedRemainingBudgetM; }
    public void setRecalculatedRemainingBudgetM(int recalculatedRemainingBudgetM) { this.recalculatedRemainingBudgetM = recalculatedRemainingBudgetM; }
}
