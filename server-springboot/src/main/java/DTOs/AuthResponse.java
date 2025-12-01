package DTOs;

import java.time.Instant;

/**
 * DTO for authentication responses (login/register)
 */
public class AuthResponse {
    
    private String token;
    private UserInfo user;
    
    // Constructors
    public AuthResponse() {
    }
    
    public AuthResponse(String token, UserInfo user) {
        this.token = token;
        this.user = user;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public UserInfo getUser() {
        return user;
    }
    
    public void setUser(UserInfo user) {
        this.user = user;
    }
    
    /**
     * Inner class for user information (without password)
     */
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
        private Instant createdAt;
        
        public UserInfo() {
        }
        
        public UserInfo(Long id, String name, String email, Instant createdAt) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.createdAt = createdAt;
        }
        
        // Getters and setters
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public Instant getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }
    }
}

