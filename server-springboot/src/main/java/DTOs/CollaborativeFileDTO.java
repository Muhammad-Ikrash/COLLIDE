package DTOs;

import java.time.Instant;

public class CollaborativeFileDTO {
    private Long id;
    private String filename;
    private String path;
    private boolean isDirectory;
    private Long addedBy;
    private String addedByName;
    private Instant createdAt;

    public CollaborativeFileDTO() {}

    public CollaborativeFileDTO(Long id, String filename, String path, boolean isDirectory, 
                                Long addedBy, String addedByName, Instant createdAt) {
        this.id = id;
        this.filename = filename;
        this.path = path;
        this.isDirectory = isDirectory;
        this.addedBy = addedBy;
        this.addedByName = addedByName;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public boolean isDirectory() { return isDirectory; }
    public void setDirectory(boolean isDirectory) { this.isDirectory = isDirectory; }

    public Long getAddedBy() { return addedBy; }
    public void setAddedBy(Long addedBy) { this.addedBy = addedBy; }

    public String getAddedByName() { return addedByName; }
    public void setAddedByName(String addedByName) { this.addedByName = addedByName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
