package com.missionorbit.controller;

import com.missionorbit.repository.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {
    private final MissionRepository missionRepo;
    private final ObjectiveRepository objectiveRepo;
    private final ComponentRepository componentRepo;
    private final LaunchVehicleRepository rocketRepo;
    private final OrbitRepository orbitRepo;

    public CatalogController(
        MissionRepository missionRepo,
        ObjectiveRepository objectiveRepo,
        ComponentRepository componentRepo,
        LaunchVehicleRepository rocketRepo,
        OrbitRepository orbitRepo
    ) {
        this.missionRepo = missionRepo;
        this.objectiveRepo = objectiveRepo;
        this.componentRepo = componentRepo;
        this.rocketRepo = rocketRepo;
        this.orbitRepo = orbitRepo;
    }

    @GetMapping("/bootstrap")
    public Map<String, Object> bootstrap() {
        return Map.of(
            "missions", missionRepo.findAll(),
            "objectives", objectiveRepo.findAll(),
            "components", componentRepo.findAll(),
            "rockets", rocketRepo.findAll(),
            "orbits", orbitRepo.findAll()
        );
    }

    @GetMapping("/missions")
    public Object missions() { return missionRepo.findAll(); }

    @GetMapping("/objectives")
    public Object objectives() { return objectiveRepo.findAll(); }

    @GetMapping("/components")
    public Object components() { return componentRepo.findAll(); }

    @GetMapping("/rockets")
    public Object rockets() { return rocketRepo.findAll(); }

    @GetMapping("/orbits")
    public Object orbits() { return orbitRepo.findAll(); }
}
