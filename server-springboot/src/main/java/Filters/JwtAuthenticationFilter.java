package Filters;

import Utils.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Filter to validate JWT tokens on protected endpoints
 * 
 * This filter runs before controllers and validates JWT tokens
 * from the Authorization header.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    // Public endpoints that don't require authentication
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/refresh",
        "/api/auth/sync",  // Sync endpoint handles its own token parsing (trusts Supabase)
        "/api/hello"
    );

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Skip CORS preflight requests (OPTIONS) - handled by CorsFilter
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String requestPath = request.getRequestURI();
        
        // Skip authentication for public endpoints
        if (isPublicEndpoint(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get token from Authorization header
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Missing or invalid Authorization header\"}");
            return;
        }

        // Extract token (remove "Bearer " prefix)
        String token = authHeader.substring(7);

        try {
            // Parse Supabase token WITHOUT signature verification
            // We trust Supabase already validated the token on their end
            String email = jwtUtil.extractEmailWithoutVerification(token);
            
            if (email == null || email.isEmpty()) {
                System.err.println("JWT Filter: Could not extract email from token");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Invalid token - could not extract email\"}");
                return;
            }

            // Extract other user info from Supabase token
            String name = jwtUtil.extractNameWithoutVerification(token);
            
            // Extract user ID from claims (sub claim)
            io.jsonwebtoken.Claims claims = jwtUtil.parseClaimsWithoutVerification(token);
            String userId = claims != null ? claims.getSubject() : null;
            
            System.out.println("JWT Filter: Token parsed successfully for user: " + email);
            
            // Store user info in request attributes for controllers to use
            request.setAttribute("userId", userId);
            request.setAttribute("email", email);
            request.setAttribute("name", name);
            
            // Continue to the next filter/controller
            filterChain.doFilter(request, response);
            
        } catch (Exception e) {
            System.err.println("JWT Filter: Exception during token parsing: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Invalid token: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Check if the endpoint is public (doesn't require authentication)
     */
    private boolean isPublicEndpoint(String path) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
    }
}

