package com.missionorbit.repository;

import com.missionorbit.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MissionRepository extends JpaRepository<Mission, String> {
    List<Mission> findByDestinationId(String destinationId);
}
