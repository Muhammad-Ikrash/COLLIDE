<!--
Repository-specific Copilot instructions for the COLLIDE project.
Keep this file concise and actionable — refer to exact files and commands.
-->

# Copilot instructions — COLLIDE (concise)

Purpose: Help AI coding agents quickly understand the project's architecture, conventions, and common developer workflows so changes are accurate and minimal.

- **Big picture**: Backend is a Java Spring Boot service in `server-springboot/`. Frontend is an Angular app in `client/COLLIDE-FRONTEND/` and an Electron wrapper in `client/Electron/`. Backend exposes REST APIs under `/api/*` which the frontend calls. Authentication uses JWT and a servlet filter for `/api/*`.

- **Key files & directories**:
  - Backend root: `server-springboot/pom.xml` (Maven, Java 21).
  - Main config: `server-springboot/src/main/resources/application.properties` (DB + JWT defaults).
  - Controllers: `server-springboot/src/main/java/Controllers/` (e.g. `AuthController.java`, `ProjectController.java`).
  - Services: `server-springboot/src/main/java/Services/` — implement business logic; prefer putting new logic here instead of directly in controllers.
  - Repositories: `server-springboot/src/main/java/Repositories/` — JPA repositories.
  - Entities/DTOs: `Entities/` and `DTOs/` follow simple POJO mapping.
  - JWT filter: `server-springboot/src/main/java/Filters/JwtAuthenticationFilter.java` and registration in `Config/FilterConfig.java`.
  - Test-data initializer: `Config/DataInitializer.java` creates a test user on startup (`test@example.com` / `password123`).

- **Auth & security patterns**:
  - JWTs are created via `Utils/JwtUtil`. Controllers return tokens in `AuthResponse` DTOs.
  - The filter is registered to apply to `"/api/*"` (see `FilterConfig.java`). Controllers often use `@CrossOrigin(origins = "*")`.

- **Database & runtime**:
  - `application.properties` uses H2 in-memory by default for convenience. When `DB_POOLER` (or proper JDBC URL) is provided it will use PostgreSQL (dependency in `pom.xml`).
  - Data initialization is programmatic via `DataInitializer` — tests and local runs rely on that rather than `data.sql`.

- **How to run locally (Windows)**:
  - Backend (from repo root):
    - `cd server-springboot` then `.
      mvnw.cmd spring-boot:run` (or `mvn spring-boot:run` if Maven is installed).
    - Build jar: `.
      mvnw.cmd package` → artifact at `server-springboot/target/`.
  - Frontend (Angular):
    - `cd client\COLLIDE-FRONTEND` then `npm install` and `npm start` (runs `ng serve` on `:4200`).
  - Full dev (Angular + Electron):
    - From `client` run `npm run dev:start` (concurrently starts Angular and Electron) or use `start-dev.bat` on Windows.

- **APIs & examples**:
  - Auth endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh` (see `AuthController.java`).
  - Project endpoints: look in `ProjectController.java` and `ProjectMemberController.java` for membership and project flows.

- **Conventions & patterns to follow**:
  - Keep controllers thin: validate inputs, call Services, map Entities→DTOs in Services or Utils.
  - Use `ResponseEntity<?>` and return small `Map` messages consistently (existing controllers follow this pattern).
  - Password hashing and verification live in `Services.UserService` — use that instead of custom hashing.
  - Use DTO classes in `DTOs/` for request/response payloads — do not pass Entities directly to the client.

- **Testing & debugging hints**:
  - H2 console is enabled for local debug at `http://localhost:8080/h2-console` (see `application.properties`).
  - When modifying authentication flows, update JwtUtil and Jwt filter together; tests may assume the test user exists (created by `DataInitializer`).

- **What to watch for when changing code**:
  - `application.properties` contains default `jwt.secret` and `jwt.expiration` values — do not leave production secrets here.
  - Controllers often log exceptions via `System.err.println` and return `Map.of("error", ...)` — match the existing style for consistency.
  - The frontend expects APIs under `/api/*` and the reset-password link format printed to the console in `AuthController`.

- **Where to add features**:
  - Add business logic in `Services/` and DB access in `Repositories/`.
  - New REST endpoints: add controller methods in `Controllers/`, wire services via constructor injection.

If anything is unclear or you want more examples (e.g., payload shapes for DTOs, exact Controller method signatures), tell me which area to expand and I'll update this file.
