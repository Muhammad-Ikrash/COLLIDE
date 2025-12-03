package Repositories;

import Entities.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByProjectId(Long projectId);
    
    Optional<ProjectFile> findByProjectIdAndPath(Long projectId, String path);
    
    boolean existsByProjectIdAndPath(Long projectId, String path);
    
    @Modifying
    @Query("DELETE FROM ProjectFile pf WHERE pf.project.id = :projectId AND pf.path = :path")
    void deleteByProjectIdAndPath(@Param("projectId") Long projectId, @Param("path") String path);
    
    @Modifying
    @Query("DELETE FROM ProjectFile pf WHERE pf.project.id = :projectId AND pf.path IN :paths")
    void deleteByProjectIdAndPathIn(@Param("projectId") Long projectId, @Param("paths") List<String> paths);
}
