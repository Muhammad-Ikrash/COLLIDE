package Controllers;

import DTOs.ChangeRoleRequest;
import Entities.Role;
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

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    /**
     * POST /api/admin/change-role
     * 
     * Change a user's system role (admin only)
     * Note: This is for system-level admin, not project roles
     */
    @PostMapping("/change-role")
    public ResponseEntity<?> changeRole(
            @Valid @RequestBody ChangeRoleRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get user by email from Supabase token
            String email = CurrentUser.getEmail(httpRequest);
            User adminUser = userService.getOrCreateUserByEmail(email, null);
            Long adminId = adminUser.getId();
            
            // TODO: Check if adminId has system admin privileges
            // For now, we'll allow any authenticated user (you should add proper admin check)
            
            Optional<User> targetUserOpt = userService.findById(request.getTargetUserId());
            if (targetUserOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Target user not found"));
            }
            
            // TODO: Implement system role change in User entity/service
            // For now, return a placeholder response
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("message", "System role change not yet implemented. Use project roles instead."));
            
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", se.getMessage()));
        } catch (IllegalArgumentException ia) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ia.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
}
