-- MISSION: ORBIT — Sample Educational Seed Data for MySQL 8.4
USE mission_orbit_db;

INSERT INTO missions (id, name, destination_id, destination_name, difficulty, estimated_duration_days, budget_limit_m, mass_limit_kg, min_comms_capacity, solar_efficiency_factor, requires_landing_system, description) VALUES
('mission-earth-climate', 'Orbital Earth Observatory', 'earth', 'Earth', 'Beginner', 180, 140, 750, 40, 1.00, FALSE, 'Launch a beginner-friendly Earth-observation satellite to monitor ocean temperatures, atmospheric gases, and global climate shifts.'),
('mission-lunar-ice', 'Lunar South Pole Ice Survey', 'moon', 'The Moon', 'Beginner', 120, 285, 950, 55, 1.00, TRUE, 'Orbit and touch down near Shackleton Crater to map permanently shadowed basins and confirm frozen water reserves.'),
('mission-mars-recon', 'Ares Polar Ice & Atmosphere Recon', 'mars', 'Mars', 'Intermediate', 320, 280, 1300, 85, 0.65, FALSE, 'Send an orbiter-class probe to Mars to study CO2 weather patterns, photograph polar deposits, and measure subsurface water ice.'),
('mission-mars-lander', 'Jezero Rim Lander Pathfinder', 'mars', 'Mars', 'Advanced', 410, 385, 1600, 95, 0.65, TRUE, 'Deploy a surface lander to an ancient Martian river delta to analyze clay minerals and daily temperatures.'),
('mission-bennu-probe', 'Bennu Carbonaceous Scout', 'bennu', 'Asteroid Bennu', 'Intermediate', 260, 230, 1050, 70, 0.90, FALSE, 'Rendezvous with near-Earth asteroid Bennu to create a 3D boulder map and measure primordial carbon-rich minerals.'),
('mission-vesta-deep', 'Vesta Protoplanet Explorer', 'vesta', 'Asteroid Vesta', 'Advanced', 540, 360, 1500, 100, 0.50, FALSE, 'Journey into the Main Asteroid Belt to investigate Vesta giant craters with high-gain deep-space comms.');

INSERT INTO mission_objectives (id, name, short_desc, beginner_explanation, required_category, science_points) VALUES
('obj-surface-photo', 'Surface Photography', 'Capture high-resolution optical imagery of craters and canyons.', 'A spacecraft camera records visible-light images so scientists can spot safe landing zones.', 'optics', 18),
('obj-mineral-analysis', 'Mineral Analysis', 'Identify rock types, iron oxides, silicates, and ores.', 'Spectrometers read reflected color fingerprints to reveal what a world is made of.', 'science', 22),
('obj-atmospheric-obs', 'Atmospheric Observation', 'Measure gas density, clouds, dust storms, and chemistry.', 'Atmospheric sensors track winds and greenhouse gases on Earth or Mars.', 'sensors', 20),
('obj-temp-measure', 'Temperature Measurement', 'Map day-night thermal swings and surface heat retention.', 'Infrared thermometers measure how quickly rocks or ice heat up and cool down.', 'sensors', 15),
('obj-water-ice', 'Water-Ice Investigation', 'Detect frozen water pockets beneath polar regolith.', 'Finding water ice helps future astronauts make drinking water and rocket fuel.', 'science', 25),
('obj-terrain-mapping', 'Terrain Mapping', 'Build 3D elevation maps of mountains and landing sites.', 'Combines optical images and altitude scans to build 3D hazard maps.', 'optics', 18),
('obj-asteroid-comp', 'Asteroid Composition Analysis', 'Sample spectral signatures of carbon, metals, and clays.', 'Studying asteroids reveals how Earth received its water and minerals.', 'science', 24),
('obj-env-monitoring', 'Environmental Monitoring', 'Track vegetation health, ocean temperature, and emissions.', 'Multi-band sensors watch Earth forests, oceans, and atmosphere every day.', 'sensors', 20);

INSERT INTO components (id, name, category, mass_kg, power_draw_w, power_gen_w, cost_m, science_value, comms_capacity, max_quantity, short_explanation) VALUES
('comp-computer', 'Radiation-Hardened Computer', 'avionics', 45, 55, 0, 18, 8, 0, 2, 'Spacecraft brain running flight software and navigation.'),
('comp-solar', 'Deployable Solar Panels', 'power-gen', 65, 0, 260, 14, 0, 0, 6, 'Photovoltaic wings converting sunlight into electrical watts.'),
('comp-battery', 'Lithium-Ion Battery Pack', 'power-storage', 55, 15, 80, 10, 0, 0, 4, 'Stores reserve energy for eclipse periods behind planets.'),
('comp-antenna', 'High-Gain Dish Antenna', 'comms', 50, 70, 0, 16, 4, 50, 3, 'Parabolic dish beaming science data back to Earth.'),
('comp-propulsion', 'Ion Propulsion Thruster', 'propulsion', 110, 140, 0, 28, 0, 0, 2, 'High-efficiency electric thruster for orbital maneuvers.'),
('comp-thermal', 'Thermal-Control Louvers', 'thermal', 40, 35, 0, 12, 0, 0, 2, 'Radiators preventing electronics from freezing or overheating.'),
('comp-camera', 'Optical Scientific Camera', 'optics', 60, 65, 0, 20, 26, 0, 2, 'Telescopic visible-light camera for photography and mapping.'),
('comp-sensors', 'Atmospheric & Thermal Sensors', 'sensors', 45, 50, 0, 16, 24, 0, 2, 'Multi-band infrared and gas sensors.'),
('comp-instrument', 'Ice & Mineral Spectrometer', 'science', 75, 85, 0, 26, 32, 0, 2, 'Detects subsurface water ice and mineral signatures.'),
('comp-lander', 'Precision Landing System', 'landing', 145, 45, 0, 32, 12, 0, 1, 'Shock-absorbing struts and descent radar for surface landing.');

INSERT INTO launch_vehicles (id, name, payload_capacity_kg, launch_cost_m, compatible_destinations_csv, reliability_rating, summary) VALUES
('rocket-scout', 'Scout-Light LV', 800, 32, 'earth,moon', 95, 'Compact orbital launcher ideal for lightweight Earth satellites and lunar probes.'),
('rocket-astra', 'Astra-Medium V', 1250, 58, 'earth,moon,mars,bennu', 97, 'Versatile medium-lift rocket capable of sending orbiters to the Moon, Mars, and asteroids.'),
('rocket-helios', 'Helios-Heavy IX', 1850, 86, 'earth,moon,mars,bennu,vesta', 98, 'Heavy-lift launch vehicle built for surface landers and Main Belt expeditions.'),
('rocket-titan', 'Titan-DeepSpace X', 2400, 115, 'moon,mars,bennu,vesta', 99, 'Super-heavy deep-space launcher providing maximum mass margin.');

INSERT INTO orbits (id, name, altitude_label, inclination_label, compatible_destinations_csv, science_multiplier, power_sunlit_ratio, description) VALUES
('orbit-leo', 'Low Earth Orbit (LEO)', '550 km altitude', '53 deg inclination', 'earth', 1.05, 0.78, 'Fast 95-minute orbit close to Earth surface for sharp photography and atmospheric sampling.'),
('orbit-llo', 'Low Lunar Polar Orbit', '100 km altitude', '90 deg polar', 'moon', 1.15, 0.85, 'Passes directly over both lunar poles every two hours for crater ice mapping.'),
('orbit-mars-polar', 'Low Mars Sun-Synchronous Orbit', '320 km altitude', '92.6 deg polar', 'mars', 1.20, 0.88, 'Consistent lighting angle over Martian canyons and polar ice caps.'),
('orbit-mars-capture', 'Mars Direct Entry & Descent', 'Surface corridor', '18 deg equatorial', 'mars,moon', 1.25, 0.82, 'Guided descent trajectory for missions carrying a Precision Landing System.'),
('orbit-asteroid-prox', 'Asteroid Proximity Halo', '2.5 - 25 km standoff', 'Terminator plane', 'bennu,vesta', 1.18, 0.96, 'Hovers along the asteroid day-night terminator line for nearly continuous solar power.');

INSERT INTO mission_events (id, phase_percent, category, title, description) VALUES
('evt-comms-drop', 25, 'Communication', 'Deep Space Communication Interruption', 'Solar plasma interference is attenuating the telemetry carrier signal.'),
('evt-power-demand', 50, 'Power', 'Unexpected Thermal & Power Demand Spike', 'Entering planetary eclipse caused heaters to draw an extra 65 W.'),
('evt-instrument-fault', 72, 'Instrument', 'Scientific Instrument Calibration Drift', 'Primary spectrometer/camera sensors show a 4.2% spectral drift.'),
('evt-nav-uncertainty', 90, 'Navigation', 'Final Orbit Insertion Navigation Uncertainty', 'Gravitational anomalies shifted trajectory by 14 km.');

INSERT INTO mission_event_choices (id, event_id, label, power_delta, comms_delta, science_delta, engineering_delta, outcome_summary) VALUES
('choice-comms-reorient', 'evt-comms-drop', 'Switch to High-Gain Pointing & Pause Science', -10, 15, -2, 8, 'Carrier lock stabilized with zero packet loss.'),
('choice-comms-boost', 'evt-comms-drop', 'Boost Transmitter Power to Maintain Live Downlink', -45, 20, 6, 2, 'Maintained continuous downlink at higher power draw.'),
('choice-power-battery', 'evt-power-demand', 'Draw Reserve Battery Power & Keep Instruments Active', -35, 0, 8, 4, 'Science sweep completed uninterrupted.'),
('choice-power-shed', 'evt-power-demand', 'Shed Non-Essential Payloads & Seal Thermal Louvers', 30, -5, -4, 9, 'Power bus stabilized with healthy safety margin.'),
('choice-inst-recal', 'evt-instrument-fault', 'Execute Full Deep-Sky Reference Calibration', -15, -5, 12, 6, 'Instrument precision restored to 99.6%.'),
('choice-nav-burn', 'evt-nav-uncertainty', 'Fire Precision Ion Trim Burn', -30, 0, 10, 10, 'Pinpoint orbital alignment achieved within 200 meters.');
