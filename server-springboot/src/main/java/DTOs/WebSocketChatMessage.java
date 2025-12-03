package DTOs;

/**
 * DTO for incoming WebSocket chat messages from clients
 */
public class WebSocketChatMessage {
    private Long projectId;
    private String content;
    private String senderToken; // JWT token for authentication

    public WebSocketChatMessage() {}

    public WebSocketChatMessage(Long projectId, String content, String senderToken) {
        this.projectId = projectId;
        this.content = content;
        this.senderToken = senderToken;
    }

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

    public String getSenderToken() {
        return senderToken;
    }

    public void setSenderToken(String senderToken) {
        this.senderToken = senderToken;
    }
}
