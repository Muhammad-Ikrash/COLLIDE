package Controllers;

import DTOs.ChatMessageDTO;
import DTOs.SendMessageRequest;
import Entities.User;
import Services.ChatService;
import Services.UserService;
import Utils.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    /**
     * Get all messages for a project
     */
    @GetMapping("/messages/{projectId}")
    public ResponseEntity<?> getMessages(
            @PathVariable Long projectId,
            HttpServletRequest request) {
        try {
            String email = CurrentUser.getEmail(request);
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            // Check access
            if (!chatService.hasAccess(projectId, user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No access to this project"));
            }

            List<ChatMessageDTO> messages = chatService.getMessages(projectId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Error getting messages: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get messages"));
        }
    }

    /**
     * Get recent messages for a project (last 100)
     */
    @GetMapping("/messages/{projectId}/recent")
    public ResponseEntity<?> getRecentMessages(
            @PathVariable Long projectId,
            HttpServletRequest request) {
        try {
            String email = CurrentUser.getEmail(request);
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            // Check access
            if (!chatService.hasAccess(projectId, user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No access to this project"));
            }

            List<ChatMessageDTO> messages = chatService.getRecentMessages(projectId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Error getting recent messages: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get messages"));
        }
    }

    /**
     * Send a new message
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @Valid @RequestBody SendMessageRequest messageRequest,
            HttpServletRequest request) {
        try {
            String email = CurrentUser.getEmail(request);
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            Long projectId = messageRequest.getProjectId();

            // Check access
            if (!chatService.hasAccess(projectId, user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No access to this project"));
            }

            ChatMessageDTO savedMessage = chatService.saveMessage(
                    projectId,
                    user,
                    messageRequest.getContent()
            );

            return ResponseEntity.ok(savedMessage);
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send message"));
        }
    }

    /**
     * Connect to chat (registers user as online for the project)
     */
    @PostMapping("/connect/{projectId}")
    public ResponseEntity<?> connect(
            @PathVariable Long projectId,
            HttpServletRequest request) {
        try {
            String email = CurrentUser.getEmail(request);
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            // Check access
            if (!chatService.hasAccess(projectId, user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No access to this project"));
            }

            chatService.registerConnection(projectId, user.getId());
            
            return ResponseEntity.ok(Map.of(
                "connected", true,
                "projectId", projectId,
                "userId", user.getId(),
                "userName", user.getName() != null ? user.getName() : user.getEmail().split("@")[0]
            ));
        } catch (Exception e) {
            System.err.println("Error connecting to chat: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to connect"));
        }
    }

    /**
     * Disconnect from chat
     */
    @PostMapping("/disconnect/{projectId}")
    public ResponseEntity<?> disconnect(
            @PathVariable Long projectId,
            HttpServletRequest request) {
        try {
            String email = CurrentUser.getEmail(request);
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isPresent()) {
                chatService.unregisterConnection(projectId, userOpt.get().getId());
            }
            
            return ResponseEntity.ok(Map.of("disconnected", true));
        } catch (Exception e) {
            System.err.println("Error disconnecting from chat: " + e.getMessage());
            return ResponseEntity.ok(Map.of("disconnected", true)); // Don't fail on disconnect
        }
    }

    /**
     * Get online users for a project chat
     */
    @GetMapping("/online/{projectId}")
    public ResponseEntity<?> getOnlineUsers(
            @PathVariable Long projectId,
            HttpServletRequest request) {
        try {
            String email = CurrentUser.getEmail(request);
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            // Check access
            if (!chatService.hasAccess(projectId, user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No access to this project"));
            }

            return ResponseEntity.ok(Map.of(
                "onlineUsers", chatService.getConnectedUsers(projectId)
            ));
        } catch (Exception e) {
            System.err.println("Error getting online users: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get online users"));
        }
    }
}
