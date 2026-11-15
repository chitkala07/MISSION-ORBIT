package com.missionorbit.repository;

import com.missionorbit.entity.Spacecraft;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpacecraftRepository extends JpaRepository<Spacecraft, Long> {
    List<Spacecraft> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);
}
