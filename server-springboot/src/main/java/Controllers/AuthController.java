package Controllers;

import DTOs.AuthResponse;
import DTOs.LoginRequest;
import DTOs.RegisterRequest;
import DTOs.ForgotPasswordRequest;
import DTOs.ResetPasswordRequest;
import DTOs.RefreshTokenRequest;
import Entities.User;
import Services.UserService;
import Utils.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller for authentication endpoints
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final UserService userService;
    private final JwtUtil jwtUtil;
    
    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }
    
    /**
     * POST /api/auth/login
     * 
     * Authenticates a user and returns a JWT token
     * 
     * @param request Login request with email and password
     * @return AuthResponse with token and user info, or error message
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // 1. Find user by email
            Optional<User> userOpt = userService.findByEmail(request.getEmail());
            
            if (userOpt.isEmpty()) {
                // Don't reveal if email exists (security best practice)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
            }
            
            User user = userOpt.get();
            
            // 2. Verify password
            if (!userService.verifyPassword(user, request.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
            }
            
            // 3. Generate JWT token
            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            
            // 4. Create user info (without password)
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
            );
            
            // 5. Return token and user info
            AuthResponse response = new AuthResponse(token, userInfo);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Log error (in production, use proper logging)
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred during login"));
        }
    }
    
    /**
     * POST /api/auth/register
     * 
     * Registers a new user and returns a JWT token
     * 
     * @param request Register request with name, email, and password
     * @return AuthResponse with token and user info, or error message
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // 1. Check if email already exists
            if (userService.emailExists(request.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email already registered"));
            }
            
            // 2. Create new user with hashed password
            User user = userService.createUser(
                request.getName(),
                request.getEmail(),
                request.getPassword()
            );
            
            // 3. Generate JWT token
            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            
            // 4. Create user info (without password)
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
            );
            
            // 5. Return token and user info
            AuthResponse response = new AuthResponse(token, userInfo);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            System.err.println("Register error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred during registration"));
        }
    }
    
    /**
     * POST /api/auth/logout
     * 
     * Logs out a user (JWT is stateless, so this is mainly for token blacklisting if needed)
     * 
     * @param authHeader Authorization header with token
     * @return Success message
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // JWT is stateless, so logout is mainly client-side
        // In production, you might want to implement token blacklisting here
        // For now, just return success - client should delete the token
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        }
        
        // Optional: Add token to blacklist (requires Redis or database)
        // For now, just return success
        
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    /**
     * POST /api/auth/refresh
     * 
     * Refreshes a JWT token by generating a new one
     * 
     * @param request Refresh token request with current token
     * @return New AuthResponse with new token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            String token = request.getToken();
            
            // 1. Validate the token
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
            }
            
            // 2. Extract user info from Supabase token
            String email = jwtUtil.extractEmail(token);
            
            // 3. Get or create user by email (Supabase auth)
            User user = userService.getOrCreateUserByEmail(email, null);
            
            // 4. Note: With Supabase, token refresh should be handled by Supabase client
            // This endpoint is kept for backward compatibility but may not work as expected
            // Supabase tokens should be refreshed using supabase.auth.refreshSession()
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("message", "Token refresh should be handled by Supabase client. Use supabase.auth.refreshSession() instead."));
            
        } catch (Exception e) {
            System.err.println("Refresh token error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred during token refresh"));
        }
    }
    
    /**
     * POST /api/auth/forgot-password
     * 
     * Sends a password reset token to the user's email
     * 
     * @param request Forgot password request with email
     * @return Success message (don't reveal if email exists)
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            Optional<User> userOpt = userService.findByEmail(request.getEmail());
            
            // Always return success (don't reveal if email exists - security best practice)
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Generate reset token (UUID)
                String resetToken = UUID.randomUUID().toString();
                
                // Set token expiry (1 hour from now)
                Instant expiry = Instant.now().plusSeconds(3600); // 1 hour
                
                user.setResetToken(resetToken);
                user.setResetTokenExpiry(expiry);
                userService.save(user);
                
                // In production, send email with reset link here
                // For now, we'll just log it (you can check server logs)
                System.out.println("Reset token for " + request.getEmail() + ": " + resetToken);
                System.out.println("Reset link: http://localhost:4200/auth/reset-password?token=" + resetToken);
            }
            
            // Always return success (security: don't reveal if email exists)
            return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a password reset link has been sent"
            ));
            
        } catch (Exception e) {
            System.err.println("Forgot password error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred"));
        }
    }
    
    /**
     * POST /api/auth/reset-password
     * 
     * Resets user password using a reset token
     * 
     * @param request Reset password request with token and new password
     * @return Success message
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            // 1. Find user by reset token
            Optional<User> userOpt = userService.findByResetToken(request.getToken());
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired reset token"));
            }
            
            User user = userOpt.get();
            
            // 2. Hash new password
            String hashedPassword = userService.hashPassword(request.getNewPassword());
            
            // 3. Update password and clear reset token
            user.setPassHash(hashedPassword);
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userService.save(user);
            
            // 4. Return success
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
            
        } catch (Exception e) {
            System.err.println("Reset password error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred during password reset"));
        }
    }
}

