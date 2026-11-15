package com.missionorbit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.missionorbit.dto.ApiDtos.RunSimulationRequest;
import com.missionorbit.entity.*;
import com.missionorbit.repository.*;
import com.missionorbit.simulation.SimulationEngine;
import com.missionorbit.simulation.SimulationEngine.SimulationOutcomeReport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class SimulationService {
    private final MissionRepository missionRepository;
    private final SpacecraftRepository spacecraftRepository;
    private final ComponentRepository componentRepository;
    private final ObjectiveRepository objectiveRepository;
    private final LaunchVehicleRepository rocketRepository;
    private final OrbitRepository orbitRepository;
    private final MissionRunRepository runRepository;
    private final MissionResultRepository resultRepository;
    private final MissionReportRepository reportRepository;
    private final ObjectMapper objectMapper;
    private final SimulationEngine simulationEngine = new SimulationEngine();

    public SimulationService(
        MissionRepository missionRepository,
        SpacecraftRepository spacecraftRepository,
        ComponentRepository componentRepository,
        ObjectiveRepository objectiveRepository,
        LaunchVehicleRepository rocketRepository,
        OrbitRepository orbitRepository,
        MissionRunRepository runRepository,
        MissionResultRepository resultRepository,
        MissionReportRepository reportRepository,
        ObjectMapper objectMapper
    ) {
        this.missionRepository = missionRepository;
        this.spacecraftRepository = spacecraftRepository;
        this.componentRepository = componentRepository;
        this.objectiveRepository = objectiveRepository;
        this.rocketRepository = rocketRepository;
        this.orbitRepository = orbitRepository;
        this.runRepository = runRepository;
        this.resultRepository = resultRepository;
        this.reportRepository = reportRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SimulationOutcomeReport runAndPersist(RunSimulationRequest req) throws Exception {
        Mission mission = missionRepository.findById(req.missionId()).orElseThrow();
        Spacecraft spacecraft = spacecraftRepository.findById(req.spacecraftId()).orElseThrow();
        LaunchVehicle rocket = rocketRepository.findById(req.launchVehicleId()).orElseThrow();
        Orbit orbit = orbitRepository.findById(req.orbitId()).orElseThrow();
        List<ScientificObjective> objectives = objectiveRepository.findAllById(req.objectiveIds());

        Map<String, ComponentCatalog> catalog = new HashMap<>();
        componentRepository.findAll().forEach(c -> catalog.put(c.getId(), c));

        SimulationOutcomeReport report = simulationEngine.simulate(
            mission, spacecraft, catalog, objectives, rocket, orbit, req.eventDecisions()
        );

        MissionRun run = new MissionRun();
        run.setUserId(req.userId());
        run.setMissionId(mission.getId());
        run.setSpacecraftId(spacecraft.getId());
        run.setLaunchVehicleId(rocket.getId());
        run.setOrbitId(orbit.getId());
        run.setSelectedObjectivesCsv(String.join(",", req.objectiveIds()));
        MissionRun savedRun = runRepository.save(run);

        MissionResult res = new MissionResult();
        res.setMissionRunId(savedRun.getId());
        res.setOutcome(report.outcome());
        res.setEngineeringScore(report.engineeringScore());
        res.setScienceScore(report.scienceScore());
        res.setResourceEfficiencyScore(report.resourceEfficiencyScore());
        res.setOverallScore(report.overallScore());
        res.setRecalculatedMassKg(report.metrics().totalMassKg());
        res.setRecalculatedPowerW(report.metrics().availablePowerW());
        res.setRecalculatedRemainingBudgetM(report.metrics().remainingBudgetM());
        MissionResult savedResult = resultRepository.save(res);

        MissionReport rep = new MissionReport();
        rep.setMissionResultId(savedResult.getId());
        rep.setSuccessfulObjectivesJson(objectMapper.writeValueAsString(report.successfulObjectives()));
        rep.setMissedObjectivesJson(objectMapper.writeValueAsString(report.missedObjectives()));
        rep.setProblemsJson(objectMapper.writeValueAsString(report.problemsEncountered()));
        rep.setSuggestionsJson(objectMapper.writeValueAsString(report.improvementSuggestions()));
        rep.setExplanation(report.explanation());
        reportRepository.save(rep);

        return report;
    }
}
