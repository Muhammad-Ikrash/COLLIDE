package Entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "project_files", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "path"})
})
public class ProjectFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String path;

    @Column(nullable = false)
    private boolean isDirectory = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Long addedBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    public ProjectFile() {}

    public ProjectFile(String filename, String path, boolean isDirectory, Long addedBy) {
        this.filename = filename;
        this.path = path;
        this.isDirectory = isDirectory;
        this.addedBy = addedBy;
    }

    public Long getId() { return id; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public boolean isDirectory() { return isDirectory; }
    public void setDirectory(boolean isDirectory) { this.isDirectory = isDirectory; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Long getAddedBy() { return addedBy; }
    public void setAddedBy(Long addedBy) { this.addedBy = addedBy; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}
