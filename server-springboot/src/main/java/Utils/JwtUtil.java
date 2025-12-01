package Utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for JWT token operations
 */
@Component
public class JwtUtil {
    
    // JWT secret key - in production, use environment variable
    // For now, using a default key (CHANGE THIS IN PRODUCTION!)
    @Value("${jwt.secret:your-256-bit-secret-key-change-this-in-production-environment}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}") // 24 hours in milliseconds
    private Long expiration;
    
    /**
     * Get the signing key
     */
    private SecretKey getSigningKey() {
        // Ensure secret is at least 256 bits (32 characters)
        String key = secret;
        if (key.length() < 32) {
            key = key + "0".repeat(32 - key.length());
        }
        return Keys.hmacShaKeyFor(key.substring(0, 32).getBytes());
    }
    
    /**
     * Extract email from Supabase token
     * Supabase stores email in "email" claim
     */
    public String extractEmail(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("email", String.class);
    }
    
    /**
     * Extract user ID from Supabase token
     * Supabase uses "sub" claim for user ID (UUID string)
     */
    public String extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        // Supabase stores user ID in "sub" claim as a UUID string
        return claims.getSubject();
    }
    
    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extract a specific claim from token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extract all claims from token
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * Check if token is expired
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * Generate token for user (legacy method - not used with Supabase)
     * Supabase generates tokens, we only validate them
     */
    @Deprecated
    public String generateToken(Long userId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createToken(claims, email);
    }
    
    /**
     * Create JWT token with claims
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Validate token
     */
    public Boolean validateToken(String token, String email) {
        final String tokenEmail = extractEmail(token);
        return (tokenEmail.equals(email) && !isTokenExpired(token));
    }
    
    /**
     * Validate token (without email check)
     */
    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}

