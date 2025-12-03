package Controllers;

import DTOs.CollaborativeFileDTO;
import DTOs.SetCollaborativeFilesRequest;
import Entities.User;
import Services.CollaborativeFileService;
import Services.UserService;
import Utils.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/files")
@CrossOrigin(origins = "*")
public class CollaborativeFileController {

    private final CollaborativeFileService collaborativeFileService;
    private final UserService userService;

    public CollaborativeFileController(CollaborativeFileService collaborativeFileService, 
                                       UserService userService) {
        this.collaborativeFileService = collaborativeFileService;
        this.userService = userService;
    }

    /**
     * Get all collaborative files for a project
     * GET /api/projects/{projectId}/files
     */
    @GetMapping
    public ResponseEntity<?> getCollaborativeFiles(@PathVariable Long projectId) {
        try {
            List<CollaborativeFileDTO> files = collaborativeFileService.getCollaborativeFiles(projectId);
            return ResponseEntity.ok(Map.of("files", files));
        } catch (Exception e) {
            System.err.println("Error getting collaborative files: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Set collaborative files for a project (bulk update - replaces existing)
     * PUT /api/projects/{projectId}/files
     */
    @PutMapping
    public ResponseEntity<?> setCollaborativeFiles(
            @PathVariable Long projectId,
            HttpServletRequest httpRequest,
            @RequestBody SetCollaborativeFilesRequest request) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            List<CollaborativeFileDTO> files = collaborativeFileService.setCollaborativeFiles(projectId, userId, request);
            return ResponseEntity.ok(Map.of(
                "message", "Collaborative files updated successfully",
                "files", files
            ));
        } catch (Exception e) {
            System.err.println("Error setting collaborative files: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Add a single collaborative file
     * POST /api/projects/{projectId}/files
     */
    @PostMapping
    public ResponseEntity<?> addCollaborativeFile(
            @PathVariable Long projectId,
            HttpServletRequest httpRequest,
            @RequestBody Map<String, Object> body) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            String path = (String) body.get("path");
            String filename = (String) body.get("filename");
            Boolean isDirectory = (Boolean) body.getOrDefault("isDirectory", false);

            if (path == null || path.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Path is required"));
            }
            if (filename == null || filename.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Filename is required"));
            }

            CollaborativeFileDTO file = collaborativeFileService.addCollaborativeFile(
                projectId, userId, path, filename, isDirectory
            );
            return ResponseEntity.ok(file);
        } catch (Exception e) {
            System.err.println("Error adding collaborative file: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Remove a collaborative file by ID
     * DELETE /api/projects/{projectId}/files/{fileId}
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> removeCollaborativeFile(
            @PathVariable Long projectId,
            @PathVariable Long fileId) {
        try {
            collaborativeFileService.removeCollaborativeFile(projectId, fileId);
            return ResponseEntity.ok(Map.of("message", "File removed from collaboration"));
        } catch (Exception e) {
            System.err.println("Error removing collaborative file: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check if a file is collaborative
     * GET /api/projects/{projectId}/files/check?path=...
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkCollaborativeFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        try {
            boolean isCollaborative = collaborativeFileService.isCollaborativeFile(projectId, path);
            return ResponseEntity.ok(Map.of("isCollaborative", isCollaborative, "path", path));
        } catch (Exception e) {
            System.err.println("Error checking collaborative file: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long getCurrentUserId(HttpServletRequest httpRequest) {
        String email = CurrentUser.getEmail(httpRequest);
        User user = userService.getOrCreateUserByEmail(email, null);
        return user.getId();
    }
}
