package Controllers;

import Utils.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Example controller showing how to use JWT authentication
 * 
 * This is just an example - you can delete this file once you understand how it works
 */
@RestController
@RequestMapping("/api/example")
@CrossOrigin(origins = "*")
public class ExampleProtectedController {
    
    /**
     * Example: Get current user info
     * 
     * This endpoint is automatically protected by JwtAuthenticationFilter
     * Client must send: Authorization: Bearer <token>
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        // Get user info from request (set by JwtAuthenticationFilter)
        // Supabase user ID is a UUID string
        String userId = CurrentUser.getUserId(request);
        String email = CurrentUser.getEmail(request);
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "email", email,
            "message", "This is a protected endpoint! You are authenticated."
        ));
    }
    
    /**
     * Example: Create something with current user as owner
     */
    @PostMapping("/create")
    public ResponseEntity<?> createSomething(
        @RequestBody Map<String, String> body,
        HttpServletRequest request
    ) {
        // Supabase user ID is a UUID string
        String userId = CurrentUser.getUserId(request);
        String name = body.get("name");
        
        // In real implementation, you would:
        // 1. Create entity with userId as owner
        // 2. Save to database
        // 3. Return created entity
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "name", name,
            "message", "Created by user " + userId
        ));
    }
}

