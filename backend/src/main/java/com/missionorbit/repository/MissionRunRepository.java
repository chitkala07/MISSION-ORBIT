package com.missionorbit.repository;

import com.missionorbit.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MissionRunRepository extends JpaRepository<MissionRun, Long> {
    List<MissionRun> findByUserIdOrderByExecutedAtDesc(Long userId);
}
