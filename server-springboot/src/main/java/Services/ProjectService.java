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
        return createProject(name, ownerId, null);
    }

    /**
     * Create a new project with folder path and add owner as ADMIN
     */
    @Transactional
    public Project createProject(String name, Long ownerId, String folderPath) {
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        
        Project project = new Project(name, ownerId, folderPath);
        project.setLastModifiedAt(Instant.now());
        project = projectRepository.save(project);
        
        // Add owner as ADMIN with the same local folder path
        ProjectMembership membership = new ProjectMembership(owner, project, Role.ADMIN);
        membership.setLocalFolderPath(folderPath);
        membershipRepository.save(membership);
        
        return project;
    }
    
    /**
     * Get all projects for a user (owned or member of, excluding banned)
     */
    public List<Project> getUserProjects(Long userId) {
        List<ProjectMembership> memberships = membershipRepository.findByUserId(userId);
        return memberships.stream()
            .filter(m -> m.getRole() != Role.BANNED)
            .map(ProjectMembership::getProject)
            .toList();
    }

    /**
     * Get all memberships for a user (excluding banned)
     */
    public List<ProjectMembership> getUserMemberships(Long userId) {
        List<ProjectMembership> memberships = membershipRepository.findByUserId(userId);
        return memberships.stream()
            .filter(m -> m.getRole() != Role.BANNED)
            .toList();
    }

    /**
     * Get member count for a project (excluding banned members)
     */
    public long getProjectMemberCount(Long projectId) {
        List<ProjectMembership> memberships = membershipRepository.findByProjectId(projectId);
        return memberships.stream()
            .filter(m -> m.getRole() != Role.BANNED)
            .count();
    }

    /**
     * Get user's membership for a specific project
     */
    public Optional<ProjectMembership> getUserMembership(Long userId, Long projectId) {
        return membershipRepository.findByUserIdAndProjectId(userId, projectId);
    }

    /**
     * Set local folder path for a user's project membership
     */
    @Transactional
    public ProjectMembership setLocalFolderPath(Long userId, Long projectId, String localFolderPath) {
        ProjectMembership membership = membershipRepository.findByUserIdAndProjectId(userId, projectId)
            .orElseThrow(() -> new IllegalArgumentException("Membership not found"));
        
        if (membership.getRole() == Role.BANNED) {
            throw new IllegalArgumentException("User is banned from this project");
        }
        
        membership.setLocalFolderPath(localFolderPath);
        return membershipRepository.save(membership);
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
        
        // Delete all memberships first (foreign key constraint)
        List<ProjectMembership> memberships = membershipRepository.findByProjectId(projectId);
        membershipRepository.deleteAll(memberships);
        
        // Now delete the project
        projectRepository.deleteById(projectId);
    }
    
    /**
     * Check if user has access to project (not banned)
     */
    public boolean hasAccess(Long userId, Long projectId) {
        Optional<ProjectMembership> membership = membershipRepository.findByUserIdAndProjectId(userId, projectId);
        return membership.isPresent() && membership.get().getRole() != Role.BANNED;
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

