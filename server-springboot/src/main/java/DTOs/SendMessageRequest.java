package DTOs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SendMessageRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    // Constructors
    public SendMessageRequest() {
    }

    public SendMessageRequest(Long projectId, String content) {
        this.projectId = projectId;
        this.content = content;
    }

    // Getters and Setters
    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
