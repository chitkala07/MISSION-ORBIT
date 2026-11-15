package com.missionorbit.simulation;

import com.missionorbit.dto.ApiDtos.EventChoiceInput;
import com.missionorbit.entity.*;
import java.util.*;

/**
 * Authoritative server-side simulation and engineering recalculation engine.
 * Never trusts client-computed mass, power, cost, or scores.
 */
public class SimulationEngine {

    public record RecalculatedMetrics(
        int totalMassKg,
        int totalPowerDrawW,
        int effectivePowerGenW,
        int availablePowerW,
        int spacecraftCostM,
        int totalCostM,
        int remainingBudgetM,
        int totalCommsCapacity,
        int totalScienceValue,
        boolean hasOnboardComputer,
        boolean hasPropulsion,
        boolean hasThermalControl,
        boolean hasLandingSystem,
        boolean rocketPayloadCompatible,
        boolean destinationCompatible,
        boolean orbitCompatible
    ) {}

    public record SimulationOutcomeReport(
        String outcome,
        int engineeringScore,
        int scienceScore,
        int resourceEfficiencyScore,
        int overallScore,
        RecalculatedMetrics metrics,
        List<String> successfulObjectives,
        List<String> missedObjectives,
        List<String> problemsEncountered,
        List<String> improvementSuggestions,
        String explanation
    ) {}

    public RecalculatedMetrics recalculateMetrics(
        Mission mission,
        Spacecraft spacecraft,
        Map<String, ComponentCatalog> catalog,
        LaunchVehicle rocket,
        Orbit orbit
    ) {
        int totalMass = 0;
        int totalDraw = 0;
        int solarRawGen = 0;
        int batteryBackupGen = 0;
        int craftCost = 0;
        int scienceVal = 0;
        int commsCap = 0;

        Map<String, Integer> categoryCounts = new HashMap<>();

        for (SpacecraftComponent item : spacecraft.getComponents()) {
            ComponentCatalog c = catalog.get(item.getComponentId());
            if (c == null || item.getQuantity() <= 0) continue;
            int q = item.getQuantity();

            totalMass += c.getMassKg() * q;
            totalDraw += c.getPowerDrawW() * q;
            if ("power-gen".equals(c.getCategory())) {
                solarRawGen += c.getPowerGenW() * q;
            } else {
                batteryBackupGen += c.getPowerGenW() * q;
            }
            craftCost += c.getCostM() * q;
            scienceVal += c.getScienceValue() * q;
            commsCap += c.getCommsCapacity() * q;
            categoryCounts.merge(c.getCategory(), q, Integer::sum);
        }

        double solarFactor = mission.getSolarEfficiencyFactor().doubleValue();
        double orbitSunlit = orbit.getPowerSunlitRatio().doubleValue();
        int effectivePowerGen = (int) Math.round(solarRawGen * solarFactor * orbitSunlit + batteryBackupGen);
        int availablePower = effectivePowerGen - totalDraw;

        int totalCost = craftCost + rocket.getLaunchCostM();
        int remainingBudget = mission.getBudgetLimitM() - totalCost;

        boolean hasComputer = categoryCounts.getOrDefault("avionics", 0) > 0;
        boolean hasPropulsion = categoryCounts.getOrDefault("propulsion", 0) > 0;
        boolean hasThermal = categoryCounts.getOrDefault("thermal", 0) > 0;
        boolean hasLander = categoryCounts.getOrDefault("landing", 0) > 0;

        boolean payloadOk = totalMass <= rocket.getPayloadCapacityKg();
        boolean destOk = Arrays.asList(rocket.getCompatibleDestinationsCsv().split(","))
            .contains(mission.getDestinationId());
        boolean orbitOk = Arrays.asList(orbit.getCompatibleDestinationsCsv().split(","))
            .contains(mission.getDestinationId());

        return new RecalculatedMetrics(
            totalMass, totalDraw, effectivePowerGen, availablePower,
            craftCost, totalCost, remainingBudget, commsCap, scienceVal,
            hasComputer, hasPropulsion, hasThermal, hasLander,
            payloadOk, destOk, orbitOk
        );
    }

    public SimulationOutcomeReport simulate(
        Mission mission,
        Spacecraft spacecraft,
        Map<String, ComponentCatalog> catalog,
        List<ScientificObjective> objectives,
        LaunchVehicle rocket,
        Orbit orbit,
        List<EventChoiceInput> decisions
    ) {
        RecalculatedMetrics m = recalculateMetrics(mission, spacecraft, catalog, rocket, orbit);

        Set<String> presentCategories = new HashSet<>();
        for (SpacecraftComponent item : spacecraft.getComponents()) {
            ComponentCatalog c = catalog.get(item.getComponentId());
            if (c != null && item.getQuantity() > 0) {
                presentCategories.add(c.getCategory());
            }
        }

        List<String> problems = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        int eng = 88;
        if (!m.hasOnboardComputer()) {
            eng -= 40;
            problems.add("Missing onboard computer caused avionics failure.");
            suggestions.add("Install at least one Radiation-Hardened Computer.");
        }
        if (!m.hasPropulsion() && !"earth".equals(mission.getDestinationId())) {
            eng -= 30;
            problems.add("Missing propulsion prevented orbital insertion.");
            suggestions.add("Add an Ion Propulsion Thruster.");
        }
        if (m.totalMassKg() > mission.getMassLimitKg() || !m.rocketPayloadCompatible()) {
            eng -= 28;
            problems.add("Mass limits exceeded.");
            suggestions.add("Reduce component mass or upgrade launch vehicle.");
        }
        if (m.availablePowerW() < 0) {
            eng -= 25;
            problems.add("Power deficit caused subsystem brownouts.");
            suggestions.add("Add Solar Panels or Batteries for positive power margin.");
        } else if (m.availablePowerW() >= 50) {
            eng += 6;
        }
        if (m.totalCommsCapacity() < mission.getMinCommsCapacity()) {
            eng -= 15;
            problems.add("Insufficient communication capacity.");
            suggestions.add("Add an additional High-Gain Dish Antenna.");
        } else {
            eng += 4;
        }
        if (!m.hasThermalControl() && !"earth".equals(mission.getDestinationId())) {
            eng -= 10;
            problems.add("Thermal stress without Thermal-Control Louvers.");
            suggestions.add("Install Thermal-Control Louvers.");
        }
        if (mission.isRequiresLandingSystem() && !m.hasLandingSystem()) {
            eng -= 35;
            problems.add("Landing aborted: Precision Landing System missing.");
            suggestions.add("Equip Precision Landing System.");
        }
        if (!m.destinationCompatible() || !m.orbitCompatible()) {
            eng -= 25;
            problems.add("Incompatible launch vehicle or orbit selection.");
            suggestions.add("Choose a rocket and orbit matching the destination.");
        }

        int evtSci = 0;
        int evtPower = 0;
        int evtComms = 0;
        if (decisions != null) {
            for (EventChoiceInput d : decisions) {
                eng += d.engineeringDelta();
                evtSci += d.scienceDelta();
                evtPower += d.powerDelta();
                evtComms += d.commsDelta();
            }
        }
        eng = clamp(eng);

        List<String> okObjectives = new ArrayList<>();
        List<String> missedObjectives = new ArrayList<>();
        int postPower = m.availablePowerW() + evtPower;
        boolean commsOk = m.totalCommsCapacity() + evtComms >= mission.getMinCommsCapacity() * 0.7;
        boolean powerOk = postPower >= -20;
        boolean landerOk = !mission.isRequiresLandingSystem() || m.hasLandingSystem();

        for (ScientificObjective obj : objectives) {
            if (presentCategories.contains(obj.getRequiredCategory()) && commsOk && powerOk && landerOk) {
                okObjectives.add(obj.getName());
            } else {
                missedObjectives.add(obj.getName());
                if (!presentCategories.contains(obj.getRequiredCategory())) {
                    problems.add("Missed objective " + obj.getName() + " (missing " + obj.getRequiredCategory() + ").");
                    suggestions.add("Install " + obj.getRequiredCategory() + " hardware.");
                }
            }
        }

        int sci = 0;
        if (!objectives.isEmpty()) {
            double ratio = (double) okObjectives.size() / objectives.size();
            double base = ratio * 65.0;
            double instBonus = Math.min(25.0, (m.totalScienceValue() / 90.0) * 25.0);
            double orbitBonus = (orbit.getScienceMultiplier().doubleValue() - 1.0) * 40.0;
            sci = clamp((int) Math.round(base + instBonus + orbitBonus + evtSci));
        }

        int eff = 50;
        if (m.remainingBudgetM() >= 0) {
            double used = (double) m.totalCostM() / Math.max(1, mission.getBudgetLimitM());
            eff += used <= 0.98 ? 35 + (int) Math.round((1.0 - Math.abs(0.82 - used)) * 15.0) : 32;
        } else {
            eff -= 30;
            problems.add("Mission exceeded budget limit.");
            suggestions.add("Reduce spacecraft or rocket cost to stay within budget.");
        }
        double massRatio = (double) m.totalMassKg() / Math.max(1, mission.getMassLimitKg());
        eff += (massRatio <= 1.0 && m.totalMassKg() > 0) ? (int) Math.round((1.0 - massRatio * 0.35) * 15.0) : -18;
        eff = clamp(eff);

        int overall = clamp((int) Math.round(eng * 0.4 + sci * 0.4 + eff * 0.2));
        String outcome;
        if (overall >= 75 && eng >= 65 && !okObjectives.isEmpty() && m.hasOnboardComputer() && landerOk && m.remainingBudgetM() >= 0) {
            outcome = "SUCCESS";
        } else if (overall >= 45 && m.hasOnboardComputer()) {
            outcome = "PARTIAL_SUCCESS";
        } else {
            outcome = "MISSION_FAILURE";
        }

        String explanation = String.format(
            "%s completed %d of %d objectives at %s with overall score %d/100.",
            spacecraft.getName(), okObjectives.size(), objectives.size(), mission.getDestinationName(), overall
        );

        return new SimulationOutcomeReport(
            outcome, eng, sci, eff, overall, m,
            okObjectives, missedObjectives,
            problems.stream().distinct().toList(),
            suggestions.stream().distinct().toList(),
            explanation
        );
    }

    private int clamp(int val) {
        return Math.max(0, Math.min(100, val));
    }
}
