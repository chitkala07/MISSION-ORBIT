package com.missionorbit.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "mission_objectives")
public class ScientificObjective {
    @Id
    @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "short_desc", nullable = false)
    private String shortDesc;
    @Column(name = "beginner_explanation", nullable = false, columnDefinition = "TEXT")
    private String beginnerExplanation;
    @Column(name = "required_category", nullable = false, length = 32)
    private String requiredCategory;
    @Column(name = "science_points", nullable = false)
    private int sciencePoints;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getShortDesc() { return shortDesc; }
    public String getBeginnerExplanation() { return beginnerExplanation; }
    public String getRequiredCategory() { return requiredCategory; }
    public int getSciencePoints() { return sciencePoints; }
}
