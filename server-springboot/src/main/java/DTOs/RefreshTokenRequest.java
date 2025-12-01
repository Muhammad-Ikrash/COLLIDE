package DTOs;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for refresh token requests
 */
public class RefreshTokenRequest {
    
    @NotBlank(message = "Token is required")
    private String token;
    
    // Constructors
    public RefreshTokenRequest() {
    }
    
    public RefreshTokenRequest(String token) {
        this.token = token;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
}

