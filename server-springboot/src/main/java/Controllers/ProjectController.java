package Controllers;

import DTOs.CreateProjectRequest;
import DTOs.UpdateProjectRequest;
import Entities.Project;
import Entities.ProjectMembership;
import Entities.User;
import Services.ProjectService;
import Services.UserService;
import Utils.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller for project CRUD operations
 */
@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {
    
    private final ProjectService projectService;
    private final UserService userService;
    
    public ProjectController(ProjectService projectService, UserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }
    
    /**
     * POST /api/projects
     * 
     * Create a new project
     */
    @PostMapping
    public ResponseEntity<?> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            
            Project project = projectService.createProject(request.getName(), userId, request.getFolderPath());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", project.getId(),
                "name", project.getName(),
                "ownerId", project.getOwnerId(),
                "folderPath", project.getFolderPath() != null ? project.getFolderPath() : "",
                "createdAt", project.getCreatedAt(),
                "lastModifiedAt", project.getLastModifiedAt()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred: " + e.getMessage()));
        }
    }
    
    /**
     * GET /api/projects
     * 
     * Get all projects for current user (includes user's local folder path)
     */
    @GetMapping
    public ResponseEntity<?> getUserProjects(HttpServletRequest request) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(request);
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            
            List<ProjectMembership> memberships = projectService.getUserMemberships(userId);
            
            List<Map<String, Object>> projectList = memberships.stream()
                .map(m -> {
                    Project p = m.getProject();
                    Map<String, Object> projectMap = new HashMap<>();
                    projectMap.put("id", p.getId());
                    projectMap.put("name", p.getName());
                    projectMap.put("ownerId", p.getOwnerId());
                    projectMap.put("folderPath", p.getFolderPath() != null ? p.getFolderPath() : "");
                    projectMap.put("localFolderPath", m.getLocalFolderPath() != null ? m.getLocalFolderPath() : "");
                    projectMap.put("role", m.getRole().name());
                    projectMap.put("createdAt", p.getCreatedAt());
                    projectMap.put("lastModifiedAt", p.getLastModifiedAt() != null ? p.getLastModifiedAt() : p.getCreatedAt());
                    return projectMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("projects", projectList));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * GET /api/projects/{id}
     * 
     * Get project details by ID (includes user's local folder path)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id, HttpServletRequest request) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(request);
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            
            Optional<Project> projectOpt = projectService.getProjectById(id);
            
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Project not found"));
            }
            
            // Check if user has access
            if (!projectService.hasAccess(userId, id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this project"));
            }
            
            Project project = projectOpt.get();
            Optional<ProjectMembership> membership = projectService.getUserMembership(userId, id);
            String localFolderPath = membership.map(ProjectMembership::getLocalFolderPath).orElse("");
            String role = membership.map(m -> m.getRole().name()).orElse("");
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", project.getId());
            response.put("name", project.getName());
            response.put("ownerId", project.getOwnerId());
            response.put("folderPath", project.getFolderPath() != null ? project.getFolderPath() : "");
            response.put("localFolderPath", localFolderPath != null ? localFolderPath : "");
            response.put("role", role);
            response.put("createdAt", project.getCreatedAt());
            response.put("lastModifiedAt", project.getLastModifiedAt() != null ? project.getLastModifiedAt() : project.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * PUT /api/projects/{id}
     * 
     * Update project
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            
            // Check if user can modify
            if (!projectService.canModify(userId, id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to modify this project"));
            }
            
            Project project = projectService.updateProject(id, request.getName());
            
            return ResponseEntity.ok(Map.of(
                "id", project.getId(),
                "name", project.getName(),
                "ownerId", project.getOwnerId(),
                "createdAt", project.getCreatedAt(),
                "lastModifiedAt", project.getLastModifiedAt(),
                "message", "Project updated successfully"
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * DELETE /api/projects/{id}
     * 
     * Delete project
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, HttpServletRequest request) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(request);
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            
            // Check if user can modify (only owner or admin can delete)
            if (!projectService.canModify(userId, id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to delete this project"));
            }
            
            projectService.deleteProject(id);
            
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }

    /**
     * PUT /api/projects/{id}/local-path
     * 
     * Set local folder path for current user's project membership
     */
    @PutMapping("/{id}/local-path")
    public ResponseEntity<?> setLocalFolderPath(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            System.out.println("Setting local path - Email: " + email + ", ProjectId: " + id);
            
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            System.out.println("User ID: " + userId);
            
            String localFolderPath = request.get("localFolderPath");
            System.out.println("Local folder path from request: " + localFolderPath);
            
            if (localFolderPath == null || localFolderPath.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Local folder path is required"));
            }
            
            // Check if user has access
            boolean hasAccess = projectService.hasAccess(userId, id);
            System.out.println("Has access: " + hasAccess);
            
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this project"));
            }
            
            ProjectMembership membership = projectService.setLocalFolderPath(userId, id, localFolderPath);
            System.out.println("Successfully set local folder path: " + membership.getLocalFolderPath());
            
            return ResponseEntity.ok(Map.of(
                "message", "Local folder path updated successfully",
                "localFolderPath", membership.getLocalFolderPath()
            ));
            
        } catch (IllegalArgumentException e) {
            System.err.println("IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred: " + e.getMessage()));
        }
    }
}