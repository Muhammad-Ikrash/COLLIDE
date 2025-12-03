package Services;

import DTOs.CollaborativeFileDTO;
import DTOs.SetCollaborativeFilesRequest;
import Entities.Project;
import Entities.ProjectFile;
import Entities.User;
import Repositories.ProjectFileRepository;
import Repositories.ProjectRepository;
import Repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CollaborativeFileService {

    private final ProjectFileRepository projectFileRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public CollaborativeFileService(ProjectFileRepository projectFileRepository,
                                    ProjectRepository projectRepository,
                                    UserRepository userRepository) {
        this.projectFileRepository = projectFileRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all collaborative files for a project
     */
    public List<CollaborativeFileDTO> getCollaborativeFiles(Long projectId) {
        List<ProjectFile> files = projectFileRepository.findByProjectId(projectId);
        
        // Get all user IDs to fetch names in batch
        Set<Long> userIds = files.stream()
            .map(ProjectFile::getAddedBy)
            .collect(Collectors.toSet());
        
        Map<Long, String> userNames = userRepository.findAllById(userIds).stream()
            .collect(Collectors.toMap(User::getId, User::getName));
        
        return files.stream()
            .map(file -> new CollaborativeFileDTO(
                file.getId(),
                file.getFilename(),
                file.getPath(),
                file.isDirectory(),
                file.getAddedBy(),
                userNames.getOrDefault(file.getAddedBy(), "Unknown"),
                file.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Set collaborative files for a project (replaces existing selection)
     */
    @Transactional
    public List<CollaborativeFileDTO> setCollaborativeFiles(Long projectId, Long userId, 
                                                            SetCollaborativeFilesRequest request) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Get existing files
        List<ProjectFile> existingFiles = projectFileRepository.findByProjectId(projectId);
        Set<String> existingPaths = existingFiles.stream()
            .map(ProjectFile::getPath)
            .collect(Collectors.toSet());
        
        // Get new paths from request
        Set<String> newPaths = request.getFiles().stream()
            .map(SetCollaborativeFilesRequest.FileSelection::getPath)
            .collect(Collectors.toSet());
        
        // Find files to remove (in existing but not in new)
        List<String> pathsToRemove = existingPaths.stream()
            .filter(path -> !newPaths.contains(path))
            .collect(Collectors.toList());
        
        // Remove files that are no longer selected
        if (!pathsToRemove.isEmpty()) {
            projectFileRepository.deleteByProjectIdAndPathIn(projectId, pathsToRemove);
        }
        
        // Add new files that don't exist yet
        List<ProjectFile> filesToAdd = new ArrayList<>();
        for (SetCollaborativeFilesRequest.FileSelection selection : request.getFiles()) {
            if (!existingPaths.contains(selection.getPath())) {
                ProjectFile newFile = new ProjectFile(
                    selection.getFilename(),
                    selection.getPath(),
                    selection.isDirectory(),
                    userId
                );
                newFile.setProject(project);
                filesToAdd.add(newFile);
            }
        }
        
        if (!filesToAdd.isEmpty()) {
            projectFileRepository.saveAll(filesToAdd);
        }
        
        // Return updated list
        return getCollaborativeFiles(projectId);
    }

    /**
     * Add a single collaborative file
     */
    @Transactional
    public CollaborativeFileDTO addCollaborativeFile(Long projectId, Long userId,
                                                      String path, String filename, boolean isDirectory) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Check if file already exists
        if (projectFileRepository.existsByProjectIdAndPath(projectId, path)) {
            throw new RuntimeException("File is already marked as collaborative");
        }
        
        ProjectFile file = new ProjectFile(filename, path, isDirectory, userId);
        file.setProject(project);
        ProjectFile saved = projectFileRepository.save(file);
        
        String userName = userRepository.findById(userId)
            .map(User::getName)
            .orElse("Unknown");
        
        return new CollaborativeFileDTO(
            saved.getId(),
            saved.getFilename(),
            saved.getPath(),
            saved.isDirectory(),
            saved.getAddedBy(),
            userName,
            saved.getCreatedAt()
        );
    }

    /**
     * Remove a collaborative file by ID
     */
    @Transactional
    public void removeCollaborativeFile(Long projectId, Long fileId) {
        ProjectFile file = projectFileRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));
        
        if (!file.getProject().getId().equals(projectId)) {
            throw new RuntimeException("File does not belong to this project");
        }
        
        projectFileRepository.delete(file);
    }

    /**
     * Remove a collaborative file by path
     */
    @Transactional
    public void removeCollaborativeFileByPath(Long projectId, String path) {
        projectFileRepository.deleteByProjectIdAndPath(projectId, path);
    }

    /**
     * Check if a file is collaborative
     */
    public boolean isCollaborativeFile(Long projectId, String path) {
        return projectFileRepository.existsByProjectIdAndPath(projectId, path);
    }
}
