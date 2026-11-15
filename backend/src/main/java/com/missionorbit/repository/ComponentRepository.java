package com.missionorbit.repository;

import com.missionorbit.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComponentRepository extends JpaRepository<ComponentCatalog, String> {}
