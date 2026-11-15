package com.missionorbit.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class ApiDtos {

    public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 64) String callsign,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record ComponentItemDto(
        @NotBlank String componentId,
        @Min(1) @Max(12) int quantity
    ) {}

    public record SaveSpacecraftRequest(
        @NotNull Long ownerUserId,
        Long teamId,
        @NotBlank @Size(min = 2, max = 100) String name,
        @NotEmpty List<ComponentItemDto> items
    ) {}

    public record EventChoiceInput(
        @NotBlank String eventId,
        int powerDelta,
        int commsDelta,
        int scienceDelta,
        int engineeringDelta
    ) {}

    public record RunSimulationRequest(
        @NotNull Long userId,
        @NotBlank String missionId,
        @NotNull Long spacecraftId,
        @NotBlank String launchVehicleId,
        @NotBlank String orbitId,
        @NotEmpty List<String> objectiveIds,
        List<EventChoiceInput> eventDecisions
    ) {}

    public record CreateTeamRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        String description,
        @NotNull Long creatorUserId
    ) {}
}
