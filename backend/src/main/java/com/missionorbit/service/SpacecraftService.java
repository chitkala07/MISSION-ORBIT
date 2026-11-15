package com.missionorbit.service;

import com.missionorbit.dto.ApiDtos.SaveSpacecraftRequest;
import com.missionorbit.entity.*;
import com.missionorbit.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class SpacecraftService {
    private final SpacecraftRepository spacecraftRepository;
    private final ComponentRepository componentRepository;

    public SpacecraftService(SpacecraftRepository spacecraftRepository, ComponentRepository componentRepository) {
        this.spacecraftRepository = spacecraftRepository;
        this.componentRepository = componentRepository;
    }

    @Transactional
    public Spacecraft saveOrUpdate(Long existingId, SaveSpacecraftRequest req) {
        Map<String, ComponentCatalog> catalog = new HashMap<>();
        componentRepository.findAll().forEach(c -> catalog.put(c.getId(), c));

        Spacecraft sc = existingId != null
            ? spacecraftRepository.findById(existingId).orElseThrow()
            : new Spacecraft();

        sc.setOwnerUserId(req.ownerUserId());
        sc.setTeamId(req.teamId());
        sc.setName(req.name().trim());
        sc.getComponents().clear();

        int totalMass = 0;
        int totalCost = 0;
        for (var item : req.items()) {
            ComponentCatalog c = catalog.get(item.componentId());
            if (c == null) throw new IllegalArgumentException("Unknown component: " + item.componentId());
            int qty = Math.min(item.quantity(), c.getMaxQuantity());
            SpacecraftComponent scComp = new SpacecraftComponent();
            scComp.setSpacecraft(sc);
            scComp.setComponentId(c.getId());
            scComp.setQuantity(qty);
            sc.getComponents().add(scComp);
            totalMass += c.getMassKg() * qty;
            totalCost += c.getCostM() * qty;
        }
        sc.setTotalMassKg(totalMass);
        sc.setTotalCostM(totalCost);
        return spacecraftRepository.save(sc);
    }

    public List<Spacecraft> listByUser(Long userId) {
        return spacecraftRepository.findByOwnerUserIdOrderByCreatedAtDesc(userId);
    }
}
