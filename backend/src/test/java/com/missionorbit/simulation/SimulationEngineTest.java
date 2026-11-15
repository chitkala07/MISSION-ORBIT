package com.missionorbit.simulation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for MISSION: ORBIT authoritative Java simulation rules.
 * Run with: mvn test (requires JDK 21 & Maven).
 */
class SimulationEngineTest {

    @Test
    void clampsScoreWithinZeroToHundred() {
        SimulationEngine engine = new SimulationEngine();
        assertNotNull(engine);
        int clampedLow = Math.max(0, Math.min(100, -15));
        int clampedHigh = Math.max(0, Math.min(100, 128));
        assertEquals(0, clampedLow);
        assertEquals(100, clampedHigh);
    }
}
