package Repositories;

import Entities.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    /**
     * Find all messages for a project, ordered by timestamp ascending
     */
    List<ChatMessage> findByProjectIdOrderByTimestampAsc(Long projectId);
    
    /**
     * Find the last N messages for a project
     */
    List<ChatMessage> findTop100ByProjectIdOrderByTimestampDesc(Long projectId);
    
    /**
     * Delete all messages for a project
     */
    void deleteByProjectId(Long projectId);
}
