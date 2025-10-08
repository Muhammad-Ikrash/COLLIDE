package Entities;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column (nullable = false, updatable = false)
    private Long id;
    
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private long ownerId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = true)
    private Instant lastModifiedAt;

    @OneToMany(mappedBy = "project",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY)
    private List<ProjectFile> files = new ArrayList<>();

    

    // Constructors
    public Project() {
    }
    public Project(String name, long ownerId) {
        this.name = name;
        this.ownerId = ownerId;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getOwnerId() { return ownerId; }
    public void setOwnerId(long ownerId) { this.ownerId = ownerId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getLastModifiedAt() { return lastModifiedAt; }
    public void setLastModifiedAt(Instant lastModifiedAt) { this.lastModifiedAt = lastModifiedAt; }

    // Files relationship helpers
    public List<ProjectFile> getFiles() { return files; }

    public void setFiles(List<ProjectFile> files) {
        this.files = files;
    }

    public void addFile(ProjectFile file) {
        files.add(file);
        file.setProject(this);
    }

    public void removeFile(ProjectFile file) {
        files.remove(file);
        file.setProject(null);
    }

}
