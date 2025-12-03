package Services;

import DTOs.ChatMessageDTO;
import Entities.ChatMessage;
import Entities.User;
import Repositories.ChatMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectService projectService;

    // Store active connections per project: projectId -> Set of userIds
    private final Map<Long, Set<Long>> activeConnections = new ConcurrentHashMap<>();

    public ChatService(ChatMessageRepository chatMessageRepository, ProjectService projectService) {
        this.chatMessageRepository = chatMessageRepository;
        this.projectService = projectService;
    }

    /**
     * Get all messages for a project
     */
    public List<ChatMessageDTO> getMessages(Long projectId) {
        List<ChatMessage> messages = chatMessageRepository.findByProjectIdOrderByTimestampAsc(projectId);
        return messages.stream()
                .map(ChatMessageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get recent messages for a project (last 100)
     */
    public List<ChatMessageDTO> getRecentMessages(Long projectId) {
        List<ChatMessage> messages = chatMessageRepository.findTop100ByProjectIdOrderByTimestampDesc(projectId);
        // Reverse to get chronological order
        Collections.reverse(messages);
        return messages.stream()
                .map(ChatMessageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Save a new message
     */
    @Transactional
    public ChatMessageDTO saveMessage(Long projectId, User sender, String content) {
        ChatMessage message = new ChatMessage(
                projectId,
                sender.getId(),
                sender.getName() != null ? sender.getName() : sender.getEmail().split("@")[0],
                sender.getEmail(),
                content
        );
        
        ChatMessage saved = chatMessageRepository.save(message);
        return ChatMessageDTO.fromEntity(saved);
    }

    /**
     * Check if user has access to project chat
     */
    public boolean hasAccess(Long projectId, Long userId) {
        return projectService.hasAccess(userId, projectId);
    }

    /**
     * Register a user as connected to a project chat
     */
    public void registerConnection(Long projectId, Long userId) {
        activeConnections.computeIfAbsent(projectId, k -> new CopyOnWriteArraySet<>()).add(userId);
    }

    /**
     * Unregister a user from a project chat
     */
    public void unregisterConnection(Long projectId, Long userId) {
        Set<Long> connections = activeConnections.get(projectId);
        if (connections != null) {
            connections.remove(userId);
            if (connections.isEmpty()) {
                activeConnections.remove(projectId);
            }
        }
    }

    /**
     * Get all connected users for a project
     */
    public Set<Long> getConnectedUsers(Long projectId) {
        return activeConnections.getOrDefault(projectId, Collections.emptySet());
    }

    /**
     * Delete all messages for a project (when project is deleted)
     */
    @Transactional
    public void deleteProjectMessages(Long projectId) {
        chatMessageRepository.deleteByProjectId(projectId);
    }
}
