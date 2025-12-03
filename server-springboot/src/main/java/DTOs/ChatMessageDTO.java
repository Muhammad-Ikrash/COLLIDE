package DTOs;

import java.time.Instant;

public class ChatMessageDTO {
    private Long id;
    private Long projectId;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String content;
    private Instant timestamp;

    // Constructors
    public ChatMessageDTO() {
    }

    public ChatMessageDTO(Long id, Long projectId, Long senderId, String senderName, 
                          String senderEmail, String content, Instant timestamp) {
        this.id = id;
        this.projectId = projectId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderEmail = senderEmail;
        this.content = content;
        this.timestamp = timestamp;
    }

    // Static factory method from entity
    public static ChatMessageDTO fromEntity(Entities.ChatMessage entity) {
        return new ChatMessageDTO(
            entity.getId(),
            entity.getProjectId(),
            entity.getSenderId(),
            entity.getSenderName(),
            entity.getSenderEmail(),
            entity.getContent(),
            entity.getTimestamp()
        );
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
