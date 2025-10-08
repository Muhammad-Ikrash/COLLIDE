package Services;

// import Entities.Project;
// import Entities.Role;
import Entities.User;
import Repositories.ProjectRepository;
import Repositories.UserRepository;
import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository, ProjectRepository projectRepository,
            ProjectMembershipService membershipService) {
        this.userRepository = userRepository;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

}
