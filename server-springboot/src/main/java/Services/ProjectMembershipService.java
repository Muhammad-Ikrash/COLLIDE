package Services;

import Entities.Project;
import Entities.ProjectMembership;
import Entities.Role;
import Entities.User;
import Repositories.ProjectMembershipRepository;
import Repositories.ProjectRepository;
import Repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ProjectMembershipService {

    private final ProjectMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public ProjectMembershipService(ProjectMembershipRepository membershipRepository, UserRepository userRepository,
            ProjectRepository projectRepository) {
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public ProjectMembership addMembership(Long actorUserId, Long targetUserId, Long projectId, Role role) {
        // actorUserId is the user performing the action; they must be ADMIN or CO_ADMIN
        // in project
        Optional<ProjectMembership> actorMembership = membershipRepository.findByUserIdAndProjectId(actorUserId,
                projectId);
        if (actorMembership.isEmpty() || (actorMembership.get().getRole() != Role.ADMIN
                && actorMembership.get().getRole() != Role.CO_ADMIN)) {
            throw new SecurityException("Not authorized to add membership");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        ProjectMembership membership = new ProjectMembership(targetUser, project, role);
        return membershipRepository.save(membership);
    }

    @Transactional
    public ProjectMembership changeMembershipRole(Long actorUserId, Long targetUserId, Long projectId, Role newRole) {
        Optional<ProjectMembership> actorMembership = membershipRepository.findByUserIdAndProjectId(actorUserId,
                projectId);
        if (actorMembership.isEmpty() || (actorMembership.get().getRole() != Role.ADMIN
                && actorMembership.get().getRole() != Role.CO_ADMIN)) {
            throw new SecurityException("Not authorized to change membership");
        }

        ProjectMembership membership = membershipRepository.findByUserIdAndProjectId(targetUserId, projectId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));
        membership.setRole(newRole);
        return membershipRepository.save(membership);
    }

    @Transactional
    public Role getMemberRole(Long userId, Long projectId) {
        ProjectMembership membership = membershipRepository.findByUserIdAndProjectId(userId, projectId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));
        return membership.getRole();
    }

}
