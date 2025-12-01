package Services;

// import Entities.Project;
// import Entities.Role;
import Entities.User;
import Repositories.ProjectRepository;
import Repositories.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, ProjectRepository projectRepository,
            ProjectMembershipService membershipService) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder(10); // Strength 10
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * Find user by email
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * Verify password matches user's stored hash
     */
    public boolean verifyPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassHash());
    }
    
    /**
     * Hash a password
     */
    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    /**
     * Create a new user
     */
    public User createUser(String name, String email, String rawPassword) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassHash(hashPassword(rawPassword));
        return userRepository.save(user);
    }
    
    /**
     * Check if email already exists
     */
    public boolean emailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
    
    /**
     * Find user by reset token
     */
    public Optional<User> findByResetToken(String token) {
        if (token == null || token.isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findAll().stream()
            .filter(user -> token.equals(user.getResetToken()))
            .filter(user -> user.getResetTokenExpiry() != null && user.getResetTokenExpiry().isAfter(java.time.Instant.now()))
            .findFirst();
    }
    
    /**
     * Save user (for updates)
     */
    public User save(User user) {
        return userRepository.save(user);
    }

    /**
     * Get or create user by email (for Supabase authentication)
     * When a user authenticates with Supabase, we look them up by email
     * If they don't exist in our database, we create a new User record
     * 
     * @param email User's email from Supabase token
     * @param name Optional name from Supabase user metadata
     * @return User entity (existing or newly created)
     */
    public User getOrCreateUserByEmail(String email, String name) {
        Optional<User> userOpt = findByEmail(email);
        if (userOpt.isPresent()) {
            return userOpt.get();
        }
        
        // User doesn't exist in our DB, create them
        // Note: We don't store password hash since Supabase handles auth
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setName(name != null ? name : email.split("@")[0]); // Use email prefix if no name
        newUser.setPassHash(""); // Empty since Supabase handles auth
        return userRepository.save(newUser);
    }

}
