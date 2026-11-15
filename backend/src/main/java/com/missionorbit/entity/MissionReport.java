package com.missionorbit.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "mission_reports")
public class MissionReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "mission_result_id", nullable = false, unique = true)
    private Long missionResultId;
    @Column(name = "successful_objectives_json", nullable = false, columnDefinition = "TEXT")
    private String successfulObjectivesJson;
    @Column(name = "missed_objectives_json", nullable = false, columnDefinition = "TEXT")
    private String missedObjectivesJson;
    @Column(name = "problems_json", nullable = false, columnDefinition = "TEXT")
    private String problemsJson;
    @Column(name = "suggestions_json", nullable = false, columnDefinition = "TEXT")
    private String suggestionsJson;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getMissionResultId() { return missionResultId; }
    public void setMissionResultId(Long missionResultId) { this.missionResultId = missionResultId; }
    public String getSuccessfulObjectivesJson() { return successfulObjectivesJson; }
    public void setSuccessfulObjectivesJson(String s) { this.successfulObjectivesJson = s; }
    public String getMissedObjectivesJson() { return missedObjectivesJson; }
    public void setMissedObjectivesJson(String m) { this.missedObjectivesJson = m; }
    public String getProblemsJson() { return problemsJson; }
    public void setProblemsJson(String p) { this.problemsJson = p; }
    public String getSuggestionsJson() { return suggestionsJson; }
    public void setSuggestionsJson(String s) { this.suggestionsJson = s; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public Instant getCreatedAt() { return createdAt; }
}
