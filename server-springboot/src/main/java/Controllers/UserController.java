package Controllers;

import DTOs.ChangePasswordRequest;
import DTOs.UpdateProfileRequest;
import Entities.User;
import Services.UserService;
import Utils.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Controller for user management endpoints
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * GET /api/users/me
     * 
     * Get current authenticated user's profile
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(request);
            User user = userService.getOrCreateUserByEmail(email, null);
            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "createdAt", user.getCreatedAt()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * PUT /api/users/me
     * 
     * Update current user's profile
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User user = userService.getOrCreateUserByEmail(email, null);
            user.setName(request.getName());
            userService.save(user);
            
            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "createdAt", user.getCreatedAt(),
                "message", "Profile updated successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * PUT /api/users/me/password
     * 
     * Change current user's password
     */
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User user = userService.getOrCreateUserByEmail(email, null);
            
            // Note: With Supabase auth, password changes should be handled by Supabase
            // This endpoint is kept for backward compatibility but may not work as expected
            // Consider redirecting users to Supabase password reset flow instead
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("message", "Password changes should be handled through Supabase. Use Supabase password reset flow."));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
}

