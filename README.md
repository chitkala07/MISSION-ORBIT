# MISSION: ORBIT

Educational space mission design and simulation web application where beginners explore the solar system, select scientific objectives, build modular 3D spacecraft, manage engineering budgets, and run deterministic mission simulations.

## Environment Limitation & Runtime Mode

This preview environment runs Node.js / Vite only (Java 21 JDK, Maven, and MySQL 8.4 are not installed in this container). Per project requirements:
- **Live Preview**: Runs the decoupled **React + Three.js** frontend prototype with the deterministic TypeScript simulation engine (`src/engine/simulationEngine.ts`) and `localStorage` persistence.
- **Full Backend & Database**: The complete **Java 21 + Spring Boot 3.4 + Spring Data JPA** backend (`backend/`) and **MySQL 8.4** schema/seed scripts (`database/`) are included and ready to run locally or in Docker.

## Project Structure (4+ Developer Team Layout)

```
├── src/                        # Frontend (React + TypeScript + Tailwind + Three.js)
│   ├── types/                  # Shared domain interfaces
│   ├── data/                   # Educational seed catalog & mission events
│   ├── engine/                 # Pure deterministic simulation & node:test unit tests
│   ├── services/               # REST API client + localStorage prototype adapter
│   ├── context/                # Centralized persisted mission state
│   └── components/
│       ├── common/             # Navbar & accessible educational tooltips
│       ├── three/              # Three.js 3D Solar System & Spacecraft scenes
│       └── pages/              # Modular screens (HQ, Explorer, Missions, Lab, Rocket, Control, Results)
├── backend/                    # Java 21 + Spring Boot + Maven REST API
│   └── src/main/java/com/missionorbit/
│       ├── config/             # BCrypt Security & CORS configuration
│       ├── controller/         # REST API controllers (/api/v1/*)
│       ├── dto/                # Bean-validated request/response records
│       ├── entity/             # JPA entities mapped to mission_orbit_db
│       ├── repository/         # Spring Data JPA repositories
│       ├── service/            # Auth, Spacecraft, and Simulation persistence services
│       └── simulation/         # Authoritative server-side SimulationEngine
├── database/
│   ├── schema.sql              # MySQL 8.4 DDL for mission_orbit_db (15 tables)
│   └── seed.sql                # Sample destinations, missions, components, rockets, orbits
├── API_DOCS.md                 # Complete REST API contract
└── README.md
```

## Setup Instructions

### 1. Frontend Prototype (Node.js)
```bash
npm install
npm run dev
```
Run frontend simulation unit tests:
```bash
npx --yes tsx --test src/engine/simulationEngine.test.ts
```

### 2. MySQL 8.4 Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 3. Java 21 Spring Boot Backend Setup
Configure environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME=mission_orbit_db`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`):
```bash
cd backend
mvn test
mvn spring-boot:run
```

### 4. Connecting Frontend to Spring Boot
Set `VITE_API_BASE_URL=http://localhost:8080` in `.env` and restart the Vite dev server.
