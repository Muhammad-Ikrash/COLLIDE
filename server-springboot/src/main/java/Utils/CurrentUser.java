package Utils;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility class to get current authenticated user info from request
 * 
 * This extracts user info that was set by JwtAuthenticationFilter
 * Note: Supabase provides UUID string user IDs, but our User entity uses Long IDs.
 * Use getEmail() to look up users in the database.
 */
public class CurrentUser {
    
    /**
     * Get current Supabase user ID (UUID string) from request
     * Note: This is the Supabase UUID, not your database User.id
     */
    public static String getSupabaseUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new IllegalStateException("User ID not found in request. Is the endpoint protected?");
        }
        return (String) userId;
    }
    
    /**
     * Get current user ID from request (Supabase UUID string)
     * @deprecated Use getSupabaseUserId() for clarity
     */
    @Deprecated
    public static String getUserId(HttpServletRequest request) {
        return getSupabaseUserId(request);
    }
    
    /**
     * Get current user email from request
     * Use this to look up users in your database
     */
    public static String getEmail(HttpServletRequest request) {
        Object email = request.getAttribute("email");
        if (email == null) {
            throw new IllegalStateException("Email not found in request. Is the endpoint protected?");
        }
        return (String) email;
    }
}

