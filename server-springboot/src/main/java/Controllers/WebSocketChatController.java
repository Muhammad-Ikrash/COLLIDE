package Controllers;

import DTOs.ChatMessageDTO;
import DTOs.WebSocketChatMessage;
import Entities.User;
import Services.ChatService;
import Services.UserService;
import Utils.JwtUtil;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

/**
 * WebSocket controller for real-time chat messaging
 */
@Controller
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public WebSocketChatController(
            SimpMessagingTemplate messagingTemplate,
            ChatService chatService,
            UserService userService,
            JwtUtil jwtUtil) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Handle incoming chat messages via WebSocket
     * Client sends to: /app/chat.send
     * Message is broadcast to: /topic/chat/{projectId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload WebSocketChatMessage message) {
        try {
            // Validate message
            if (message.getProjectId() == null || message.getContent() == null || message.getContent().trim().isEmpty()) {
                System.err.println("WebSocket: Invalid message - missing projectId or content");
                return;
            }

            // Authenticate user from token
            String token = message.getSenderToken();
            if (token == null || token.isEmpty()) {
                System.err.println("WebSocket: No token provided");
                return;
            }

            // Extract email from token
            String email = jwtUtil.extractEmailWithoutVerification(token);
            if (email == null || email.isEmpty()) {
                System.err.println("WebSocket: Could not extract email from token");
                return;
            }

            // Find user
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                System.err.println("WebSocket: User not found for email: " + email);
                return;
            }
            User user = userOpt.get();

            // Check access to project
            if (!chatService.hasAccess(message.getProjectId(), user.getId())) {
                System.err.println("WebSocket: User " + email + " has no access to project " + message.getProjectId());
                return;
            }

            // Save message to database
            ChatMessageDTO savedMessage = chatService.saveMessage(
                    message.getProjectId(),
                    user,
                    message.getContent().trim()
            );

            System.out.println("WebSocket: Broadcasting message to /topic/chat/" + message.getProjectId());

            // Broadcast message to all subscribers of this project's chat
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + message.getProjectId(),
                    savedMessage
            );

        } catch (Exception e) {
            System.err.println("WebSocket: Error processing message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle user joining a chat room
     * Client sends to: /app/chat.join
     * Notification is broadcast to: /topic/chat/{projectId}/users
     */
    @MessageMapping("/chat.join")
    public void joinChat(@Payload WebSocketChatMessage message) {
        try {
            if (message.getProjectId() == null || message.getSenderToken() == null) {
                return;
            }

            String email = jwtUtil.extractEmailWithoutVerification(message.getSenderToken());
            if (email == null) return;

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) return;

            User user = userOpt.get();
            
            if (!chatService.hasAccess(message.getProjectId(), user.getId())) {
                return;
            }

            // Register connection
            chatService.registerConnection(message.getProjectId(), user.getId());

            System.out.println("WebSocket: User " + user.getName() + " joined chat for project " + message.getProjectId());

            // Broadcast user joined event
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + message.getProjectId() + "/users",
                    new UserJoinedEvent(user.getId(), user.getName(), "joined")
            );
        } catch (Exception e) {
            System.err.println("WebSocket: Error in joinChat: " + e.getMessage());
        }
    }

    /**
     * Handle user leaving a chat room
     * Client sends to: /app/chat.leave
     */
    @MessageMapping("/chat.leave")
    public void leaveChat(@Payload WebSocketChatMessage message) {
        try {
            if (message.getProjectId() == null || message.getSenderToken() == null) {
                return;
            }

            String email = jwtUtil.extractEmailWithoutVerification(message.getSenderToken());
            if (email == null) return;

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) return;

            User user = userOpt.get();
            
            // Unregister connection
            chatService.unregisterConnection(message.getProjectId(), user.getId());

            System.out.println("WebSocket: User " + user.getName() + " left chat for project " + message.getProjectId());

            // Broadcast user left event
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + message.getProjectId() + "/users",
                    new UserJoinedEvent(user.getId(), user.getName(), "left")
            );
        } catch (Exception e) {
            System.err.println("WebSocket: Error in leaveChat: " + e.getMessage());
        }
    }

    /**
     * Simple DTO for user join/leave events
     */
    public static class UserJoinedEvent {
        private Long userId;
        private String userName;
        private String action;

        public UserJoinedEvent(Long userId, String userName, String action) {
            this.userId = userId;
            this.userName = userName;
            this.action = action;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }
}
