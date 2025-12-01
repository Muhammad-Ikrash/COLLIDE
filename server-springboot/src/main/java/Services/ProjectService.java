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

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    
    public ProjectService(ProjectRepository projectRepository, 
                         ProjectMembershipRepository membershipRepository,
                         UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new project and add owner as ADMIN
     */
    @Transactional
    public Project createProject(String name, Long ownerId) {
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        
        Project project = new Project(name, ownerId);
        project.setLastModifiedAt(Instant.now());
        project = projectRepository.save(project);
        
        // Add owner as ADMIN
        ProjectMembership membership = new ProjectMembership(owner, project, Role.ADMIN);
        membershipRepository.save(membership);
        
        return project;
    }
    
    /**
     * Get all projects for a user (owned or member of)
     */
    public List<Project> getUserProjects(Long userId) {
        List<ProjectMembership> memberships = membershipRepository.findByUserId(userId);
        return memberships.stream()
            .map(ProjectMembership::getProject)
            .toList();
    }
    
    /**
     * Get project by ID
     */
    public Optional<Project> getProjectById(Long projectId) {
        return projectRepository.findById(projectId);
    }
    
    /**
     * Update project
     */
    @Transactional
    public Project updateProject(Long projectId, String name) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        project.setName(name);
        project.setLastModifiedAt(Instant.now());
        return projectRepository.save(project);
    }
    
    /**
     * Delete project
     */
    @Transactional
    public void deleteProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new IllegalArgumentException("Project not found");
        }
        projectRepository.deleteById(projectId);
    }
    
    /**
     * Check if user has access to project
     */
    public boolean hasAccess(Long userId, Long projectId) {
        return membershipRepository.findByUserIdAndProjectId(userId, projectId).isPresent();
    }
    
    /**
     * Check if user is owner or admin/co-admin
     */
    public boolean canModify(Long userId, Long projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return false;
        }
        
        Project project = projectOpt.get();
        if (project.getOwnerId() == userId.longValue()) {
            return true;
        }
        
        Optional<ProjectMembership> membership = membershipRepository.findByUserIdAndProjectId(userId, projectId);
        return membership.isPresent() && 
               (membership.get().getRole() == Role.ADMIN || membership.get().getRole() == Role.CO_ADMIN);
    }
}

