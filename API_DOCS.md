# MISSION: ORBIT — REST API Documentation

Base URL: `http://localhost:8080/api/v1`

## Authentication
- `POST /auth/register` — Register a new user (`callsign`, `email`, `password`). Passwords are hashed using BCrypt (strength 12).
- `POST /auth/login` — Authenticate user credentials against stored BCrypt hash.

## Catalog Endpoints
- `GET /catalog/bootstrap` — Returns missions, objectives, components, launch vehicles, and orbits.
- `GET /catalog/missions` — List all missions.
- `GET /catalog/objectives` — List scientific objectives.
- `GET /catalog/components` — List spacecraft components.
- `GET /catalog/rockets` — List launch vehicles.
- `GET /catalog/orbits` — List orbital profiles.

## Spacecraft Management
- `GET /spacecraft/user/{userId}` — List saved spacecraft for a user.
- `POST /spacecraft` — Create spacecraft (`ownerUserId`, `teamId`, `name`, `items`). Mass and cost are recalculated on the server.
- `PUT /spacecraft/{id}` — Update spacecraft configuration and recalculate totals.

## Simulation & History
- `POST /simulations/run` — Execute authoritative server-side simulation (`userId`, `missionId`, `spacecraftId`, `launchVehicleId`, `orbitId`, `objectiveIds`, `eventDecisions`). Persists `mission_runs`, `mission_results`, and `mission_reports`.
- `GET /simulations/history/{userId}` — Retrieve user's historical mission runs.

## Teams
- `POST /teams` — Create an engineering team (`name`, `description`, `creatorUserId`).
- `POST /teams/{teamId}/members/{userId}` — Add a user to a team.
