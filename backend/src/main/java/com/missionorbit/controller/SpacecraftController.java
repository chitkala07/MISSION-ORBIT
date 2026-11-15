package com.missionorbit.controller;

import com.missionorbit.dto.ApiDtos.SaveSpacecraftRequest;
import com.missionorbit.entity.Spacecraft;
import com.missionorbit.service.SpacecraftService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/spacecraft")
public class SpacecraftController {
    private final SpacecraftService spacecraftService;

    public SpacecraftController(SpacecraftService spacecraftService) {
        this.spacecraftService = spacecraftService;
    }

    @GetMapping("/user/{userId}")
    public List<Spacecraft> listByUser(@PathVariable Long userId) {
        return spacecraftService.listByUser(userId);
    }

    @PostMapping
    public Spacecraft create(@Valid @RequestBody SaveSpacecraftRequest req) {
        return spacecraftService.saveOrUpdate(null, req);
    }

    @PutMapping("/{id}")
    public Spacecraft update(@PathVariable Long id, @Valid @RequestBody SaveSpacecraftRequest req) {
        return spacecraftService.saveOrUpdate(id, req);
    }
}
