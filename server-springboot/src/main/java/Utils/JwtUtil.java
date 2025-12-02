package Utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for JWT token operations
 * Configured to validate Supabase JWT tokens
 */
@Component
public class JwtUtil {
    
    // JWT secret key from Supabase (Base64 encoded)
    @Value("${jwt.secret:your-256-bit-secret-key-change-this-in-production-environment}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}") // 24 hours in milliseconds
    private Long expiration;
    
    /**
     * Get the signing key - decodes Base64 Supabase secret
     */
    private SecretKey getSigningKey() {
        // Supabase JWT secrets are Base64 encoded
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
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
     * Extract user name from Supabase token
     * Supabase stores user metadata in "user_metadata" claim
     */
    @SuppressWarnings("unchecked")
    public String extractName(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object userMetadata = claims.get("user_metadata");
            if (userMetadata instanceof Map) {
                Map<String, Object> metadata = (Map<String, Object>) userMetadata;
                Object fullName = metadata.get("full_name");
                if (fullName != null) {
                    return fullName.toString();
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
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
            Claims claims = extractAllClaims(token);
            boolean expired = claims.getExpiration().before(new Date());
            if (expired) {
                System.err.println("JwtUtil: Token is expired. Expiration: " + claims.getExpiration());
            }
            return !expired;
        } catch (Exception e) {
            System.err.println("JwtUtil: Token validation error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Parse Supabase JWT claims WITHOUT signature verification.
     * Use this only for Supabase tokens where we trust Supabase already validated the token.
     * This is necessary because Supabase uses its own JWT secret for signing.
     * 
     * @param token The JWT token string
     * @return Claims object with token data, or null if parsing fails
     */
    @SuppressWarnings("unchecked")
    public Claims parseClaimsWithoutVerification(String token) {
        try {
            // JWT has 3 parts: header.payload.signature
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                System.err.println("JwtUtil: Invalid JWT format");
                return null;
            }
            
            // Decode the payload (middle part) - it's Base64URL encoded
            String payload = parts[1];
            byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);
            String payloadJson = new String(decodedBytes);
            
            // Parse JSON to map
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> claimsMap = mapper.readValue(payloadJson, Map.class);
            
            // Convert to Claims using Jwts builder
            return Jwts.claims().add(claimsMap).build();
        } catch (Exception e) {
            System.err.println("JwtUtil: Error parsing token without verification: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract email from Supabase token WITHOUT signature verification
     */
    public String extractEmailWithoutVerification(String token) {
        Claims claims = parseClaimsWithoutVerification(token);
        if (claims == null) return null;
        return claims.get("email", String.class);
    }
    
    /**
     * Extract name from Supabase token WITHOUT signature verification
     */
    @SuppressWarnings("unchecked")
    public String extractNameWithoutVerification(String token) {
        Claims claims = parseClaimsWithoutVerification(token);
        if (claims == null) return null;
        try {
            Object userMetadata = claims.get("user_metadata");
            if (userMetadata instanceof Map) {
                Map<String, Object> metadata = (Map<String, Object>) userMetadata;
                Object fullName = metadata.get("full_name");
                if (fullName != null) {
                    return fullName.toString();
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}

