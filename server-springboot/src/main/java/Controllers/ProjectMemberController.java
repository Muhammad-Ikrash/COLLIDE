package Controllers;

import DTOs.AddMemberRequest;
import DTOs.UpdateMemberRoleRequest;
import Entities.ProjectMembership;
import Entities.User;
import Repositories.ProjectMembershipRepository;
import Repositories.UserRepository;
import Services.ProjectMembershipService;
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
 * Controller for project membership management
 */
@RestController
@RequestMapping("/api/projects/{projectId}/members")
@CrossOrigin(origins = "*")
public class ProjectMemberController {
    
    private final ProjectMembershipService membershipService;
    private final ProjectService projectService;
    private final UserService userService;
    private final ProjectMembershipRepository membershipRepository;
    
    public ProjectMemberController(ProjectMembershipService membershipService, 
                                  ProjectService projectService,
                                  UserService userService,
                                  ProjectMembershipRepository membershipRepository) {
        this.membershipService = membershipService;
        this.projectService = projectService;
        this.userService = userService;
        this.membershipRepository = membershipRepository;
    }
    
    /**
     * POST /api/projects/{projectId}/members
     * 
     * Add a member to a project
     */
    @PostMapping
    public ResponseEntity<?> addMember(
            @PathVariable Long projectId,
            @Valid @RequestBody AddMemberRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User actorUser = userService.getOrCreateUserByEmail(email, null);
            Long actorUserId = actorUser.getId();
            
            // Check if user can modify project
            if (!projectService.canModify(actorUserId, projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to add members to this project"));
            }
            
            // Find target user by email
            Optional<User> targetUserOpt = userService.findByEmail(request.getEmail());
            if (targetUserOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            
            User targetUser = targetUserOpt.get();
            
            // Check if user is already a member
            if (membershipRepository.findByUserIdAndProjectId(targetUser.getId(), projectId).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "User is already a member of this project"));
            }
            
            ProjectMembership membership = membershipService.addMembership(
                actorUserId, targetUser.getId(), projectId, request.getRole()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", membership.getId(),
                "userId", membership.getUser().getId(),
                "userName", membership.getUser().getName(),
                "userEmail", membership.getUser().getEmail(),
                "role", membership.getRole().toString(),
                "message", "Member added successfully"
            ));
            
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred: " + e.getMessage()));
        }
    }
    
    /**
     * GET /api/projects/{projectId}/members
     * 
     * Get all members of a project
     */
    @GetMapping
    public ResponseEntity<?> getMembers(@PathVariable Long projectId, HttpServletRequest request) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(request);
            User user = userService.getOrCreateUserByEmail(email, null);
            Long userId = user.getId();
            
            // Check if user has access
            if (!projectService.hasAccess(userId, projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this project"));
            }
            
            List<ProjectMembership> memberships = membershipRepository.findByProjectId(projectId);
            
            List<Map<String, Object>> memberList = memberships.stream()
                .map(m -> {
                    Map<String, Object> memberMap = new HashMap<>();
                    memberMap.put("id", m.getId());
                    memberMap.put("userId", m.getUser().getId());
                    memberMap.put("userName", m.getUser().getName());
                    memberMap.put("userEmail", m.getUser().getEmail());
                    memberMap.put("role", m.getRole().toString());
                    memberMap.put("createdAt", m.getCreatedAt());
                    return memberMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("members", memberList));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * PUT /api/projects/{projectId}/members/{userId}
     * 
     * Update member role
     */
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User actorUser = userService.getOrCreateUserByEmail(email, null);
            Long actorUserId = actorUser.getId();
            
            ProjectMembership membership = membershipService.changeMembershipRole(
                actorUserId, userId, projectId, request.getRole()
            );
            
            return ResponseEntity.ok(Map.of(
                "id", membership.getId(),
                "userId", membership.getUser().getId(),
                "role", membership.getRole().toString(),
                "message", "Member role updated successfully"
            ));
            
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * DELETE /api/projects/{projectId}/members/{userId}
     * 
     * Remove member from project
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            HttpServletRequest request) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(request);
            User actorUser = userService.getOrCreateUserByEmail(email, null);
            Long actorUserId = actorUser.getId();
            
            // Check if user can modify
            if (!projectService.canModify(actorUserId, projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to remove members"));
            }
            
            // Find membership
            Optional<ProjectMembership> membershipOpt = membershipRepository.findByUserIdAndProjectId(userId, projectId);
            if (membershipOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Membership not found"));
            }
            
            // Don't allow removing the owner
            var projectOpt = projectService.getProjectById(projectId);
            if (projectOpt.isPresent() && projectOpt.get().getOwnerId() == userId.longValue()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Cannot remove project owner"));
            }
            
            membershipRepository.delete(membershipOpt.get());
            
            return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
}

