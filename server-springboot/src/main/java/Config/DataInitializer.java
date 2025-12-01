package Config;

import Entities.User;
import Repositories.UserRepository;
import Services.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Creates test user on application startup
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserService userService;

    public DataInitializer(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if test user already exists
        if (userRepository.findByEmail("test@example.com").isEmpty()) {
            // Create test user
            User testUser = new User();
            testUser.setName("Test User");
            testUser.setEmail("test@example.com");
            // Hash the password
            testUser.setPassHash(userService.hashPassword("password123"));
            
            userRepository.save(testUser);
            System.out.println("✅ Test user created: test@example.com / password123");
        } else {
            System.out.println("ℹ️  Test user already exists");
        }
    }
}

