package Controllers;

// import Entities.Role;
// import Entities.User;
import Services.UserService;
// import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    // // Example endpoint: POST /api/admin/change-role?adminId=1&targetId=2&role=CONTRIBUTOR
    // @PostMapping("/change-role")
    // public ResponseEntity<?> changeRole(
    //         @RequestParam Long adminId,
    //         @RequestParam Long targetId,
    //         @RequestParam Role role
    // ) {

    //     // just an example , will adjust later
    //     try {
    //         User updated = userService.changeUserRole(adminId, targetId, role);
    //         return ResponseEntity.ok(updated);
    //     } catch (SecurityException se) {
    //         return ResponseEntity.status(403).body(se.getMessage());
    //     } catch (IllegalArgumentException ia) {
    //         return ResponseEntity.badRequest().body(ia.getMessage());
    //     }
    // }
}
