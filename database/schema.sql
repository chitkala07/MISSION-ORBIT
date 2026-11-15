-- MISSION: ORBIT — MySQL 8.4 Relational Database Schema
-- Database: mission_orbit_db

CREATE DATABASE IF NOT EXISTS mission_orbit_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mission_orbit_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  callsign VARCHAR(64) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('COMMANDER', 'FLIGHT_ENGINEER', 'SCIENCE_LEAD', 'ADMIN') NOT NULL DEFAULT 'COMMANDER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_by_user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  member_role VARCHAR(40) NOT NULL DEFAULT 'ENGINEER',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_team_user (team_id, user_id),
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS missions (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  destination_id VARCHAR(32) NOT NULL,
  destination_name VARCHAR(64) NOT NULL,
  difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  estimated_duration_days INT NOT NULL CHECK (estimated_duration_days > 0),
  budget_limit_m INT NOT NULL CHECK (budget_limit_m > 0),
  mass_limit_kg INT NOT NULL CHECK (mass_limit_kg > 0),
  min_comms_capacity INT NOT NULL DEFAULT 40,
  solar_efficiency_factor DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  requires_landing_system BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mission_objectives (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  short_desc VARCHAR(255) NOT NULL,
  beginner_explanation TEXT NOT NULL,
  required_category VARCHAR(32) NOT NULL,
  science_points INT NOT NULL CHECK (science_points > 0)
);

CREATE TABLE IF NOT EXISTS components (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(32) NOT NULL,
  mass_kg INT NOT NULL CHECK (mass_kg >= 0),
  power_draw_w INT NOT NULL CHECK (power_draw_w >= 0),
  power_gen_w INT NOT NULL CHECK (power_gen_w >= 0),
  cost_m INT NOT NULL CHECK (cost_m >= 0),
  science_value INT NOT NULL DEFAULT 0,
  comms_capacity INT NOT NULL DEFAULT 0,
  max_quantity INT NOT NULL DEFAULT 4,
  short_explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS spacecraft (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_user_id BIGINT NOT NULL,
  team_id BIGINT NULL,
  name VARCHAR(100) NOT NULL,
  total_mass_kg INT NOT NULL DEFAULT 0,
  total_cost_m INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sc_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sc_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS spacecraft_components (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  spacecraft_id BIGINT NOT NULL,
  component_id VARCHAR(64) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  UNIQUE KEY uk_sc_comp (spacecraft_id, component_id),
  CONSTRAINT fk_scc_sc FOREIGN KEY (spacecraft_id) REFERENCES spacecraft(id) ON DELETE CASCADE,
  CONSTRAINT fk_scc_comp FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS launch_vehicles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  payload_capacity_kg INT NOT NULL CHECK (payload_capacity_kg > 0),
  launch_cost_m INT NOT NULL CHECK (launch_cost_m >= 0),
  compatible_destinations_csv VARCHAR(120) NOT NULL,
  reliability_rating INT NOT NULL CHECK (reliability_rating BETWEEN 1 AND 100),
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orbits (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  altitude_label VARCHAR(64) NOT NULL,
  inclination_label VARCHAR(64) NOT NULL,
  compatible_destinations_csv VARCHAR(120) NOT NULL,
  science_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  power_sunlit_ratio DECIMAL(4,2) NOT NULL DEFAULT 0.85,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mission_runs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  mission_id VARCHAR(64) NOT NULL,
  spacecraft_id BIGINT NOT NULL,
  launch_vehicle_id VARCHAR(64) NOT NULL,
  orbit_id VARCHAR(64) NOT NULL,
  selected_objectives_csv VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mr_mission FOREIGN KEY (mission_id) REFERENCES missions(id),
  CONSTRAINT fk_mr_sc FOREIGN KEY (spacecraft_id) REFERENCES spacecraft(id),
  CONSTRAINT fk_mr_rocket FOREIGN KEY (launch_vehicle_id) REFERENCES launch_vehicles(id),
  CONSTRAINT fk_mr_orbit FOREIGN KEY (orbit_id) REFERENCES orbits(id)
);

CREATE TABLE IF NOT EXISTS mission_events (
  id VARCHAR(64) PRIMARY KEY,
  phase_percent INT NOT NULL CHECK (phase_percent BETWEEN 1 AND 100),
  category VARCHAR(32) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mission_event_choices (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL,
  label VARCHAR(160) NOT NULL,
  power_delta INT NOT NULL DEFAULT 0,
  comms_delta INT NOT NULL DEFAULT 0,
  science_delta INT NOT NULL DEFAULT 0,
  engineering_delta INT NOT NULL DEFAULT 0,
  outcome_summary VARCHAR(255) NOT NULL,
  CONSTRAINT fk_mec_event FOREIGN KEY (event_id) REFERENCES mission_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mission_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mission_run_id BIGINT NOT NULL UNIQUE,
  outcome ENUM('SUCCESS', 'PARTIAL_SUCCESS', 'MISSION_FAILURE') NOT NULL,
  engineering_score INT NOT NULL CHECK (engineering_score BETWEEN 0 AND 100),
  science_score INT NOT NULL CHECK (science_score BETWEEN 0 AND 100),
  resource_efficiency_score INT NOT NULL CHECK (resource_efficiency_score BETWEEN 0 AND 100),
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  recalculated_mass_kg INT NOT NULL,
  recalculated_power_w INT NOT NULL,
  recalculated_remaining_budget_m INT NOT NULL,
  CONSTRAINT fk_mres_run FOREIGN KEY (mission_run_id) REFERENCES mission_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mission_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mission_result_id BIGINT NOT NULL UNIQUE,
  successful_objectives_json TEXT NOT NULL,
  missed_objectives_json TEXT NOT NULL,
  problems_json TEXT NOT NULL,
  suggestions_json TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mrep_res FOREIGN KEY (mission_result_id) REFERENCES mission_results(id) ON DELETE CASCADE
);
