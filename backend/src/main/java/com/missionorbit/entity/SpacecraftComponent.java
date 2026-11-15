package com.missionorbit.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "spacecraft_components")
public class SpacecraftComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spacecraft_id", nullable = false)
    private Spacecraft spacecraft;

    @Column(name = "component_id", nullable = false, length = 64)
    private String componentId;

    @Column(nullable = false)
    private int quantity;

    public Long getId() { return id; }
    public Spacecraft getSpacecraft() { return spacecraft; }
    public void setSpacecraft(Spacecraft spacecraft) { this.spacecraft = spacecraft; }
    public String getComponentId() { return componentId; }
    public void setComponentId(String componentId) { this.componentId = componentId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
