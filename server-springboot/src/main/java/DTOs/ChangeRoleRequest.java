package DTOs;

import Entities.Role;
import jakarta.validation.constraints.NotNull;

public class ChangeRoleRequest {
    
    @NotNull(message = "Target user ID is required")
    private Long targetUserId;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    public ChangeRoleRequest() {}
    
    public ChangeRoleRequest(Long targetUserId, Role role) {
        this.targetUserId = targetUserId;
        this.role = role;
    }
    
    public Long getTargetUserId() {
        return targetUserId;
    }
    
    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }
    
    public Role getRole() {
        return role;
    }
    
    public void setRole(Role role) {
        this.role = role;
    }
}

