package com.missionorbit.controller;

import com.missionorbit.dto.ApiDtos.*;
import com.missionorbit.entity.*;
import com.missionorbit.repository.*;
import com.missionorbit.service.SimulationService;
import com.missionorbit.simulation.SimulationEngine.SimulationOutcomeReport;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class SimulationController {
    private final SimulationService simulationService;
    private final MissionRunRepository runRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public SimulationController(
        SimulationService simulationService,
        MissionRunRepository runRepository,
        TeamRepository teamRepository,
        TeamMemberRepository teamMemberRepository
    ) {
        this.simulationService = simulationService;
        this.runRepository = runRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @PostMapping("/simulations/run")
    public SimulationOutcomeReport runSimulation(@Valid @RequestBody RunSimulationRequest req) throws Exception {
        return simulationService.runAndPersist(req);
    }

    @GetMapping("/simulations/history/{userId}")
    public List<MissionRun> getHistory(@PathVariable Long userId) {
        return runRepository.findByUserIdOrderByExecutedAtDesc(userId);
    }

    @PostMapping("/teams")
    public Team createTeam(@Valid @RequestBody CreateTeamRequest req) {
        if (teamRepository.existsByName(req.name().trim())) {
            throw new IllegalArgumentException("Team name already exists.");
        }
        Team t = new Team();
        t.setName(req.name().trim());
        t.setDescription(req.description());
        t.setCreatedByUserId(req.creatorUserId());
        Team saved = teamRepository.save(t);

        TeamMember owner = new TeamMember();
        owner.setTeamId(saved.getId());
        owner.setUserId(req.creatorUserId());
        owner.setMemberRole("LEAD");
        teamMemberRepository.save(owner);
        return saved;
    }

    @PostMapping("/teams/{teamId}/members/{userId}")
    public TeamMember addMember(@PathVariable Long teamId, @PathVariable Long userId) {
        TeamMember m = new TeamMember();
        m.setTeamId(teamId);
        m.setUserId(userId);
        m.setMemberRole("ENGINEER");
        return teamMemberRepository.save(m);
    }
}
