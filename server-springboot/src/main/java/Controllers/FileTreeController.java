package Controllers;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FileTreeController {

    // Hardcoded root path (matches the original Node server)
    private static final String ROOT = "C:\\Users\\Admin\\Desktop\\filetree";

    private final AtomicLong nextId = new AtomicLong(1);

    @GetMapping("/tree")
    public ResponseEntity<?> getTree() {
        try {
            nextId.set(1);
            Path rootPath = Paths.get(ROOT);
            FileNode root = nodeForPath(rootPath);
            return ResponseEntity.ok(root);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.toString()));
        }
    }

    @GetMapping("/file")
    public ResponseEntity<?> readFile(@RequestParam("path") String pathStr) {
        try {
            Path p = Paths.get(pathStr).toAbsolutePath().normalize();
            Path root = Paths.get(ROOT).toAbsolutePath().normalize();
            if (!p.startsWith(root)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
            }
            if (!Files.exists(p) || Files.isDirectory(p)) {
                return ResponseEntity.status(404).body(java.util.Map.of("error", "Not found or is a directory"));
            }
            String content = Files.readString(p);
            return ResponseEntity.ok(java.util.Map.of("path", p.toString(), "content", content));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.toString()));
        }
    }

    @PostMapping("/file")
    public ResponseEntity<?> writeFile(@RequestBody java.util.Map<String, String> body) {
        try {
            String pathStr = body.get("path");
            String content = body.get("content");
            if (pathStr == null || content == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "path and content required"));
            }
            Path p = Paths.get(pathStr).toAbsolutePath().normalize();
            Path root = Paths.get(ROOT).toAbsolutePath().normalize();
            if (!p.startsWith(root)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
            }
            Files.createDirectories(p.getParent());
            Files.writeString(p, content, java.nio.charset.StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.TRUNCATE_EXISTING);
            return ResponseEntity.ok(java.util.Map.of("path", p.toString()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.toString()));
        }
    }

    private FileNode nodeForPath(Path p) {
        try {
            boolean isDir = Files.isDirectory(p);
            String name = p.getFileName() != null ? p.getFileName().toString() : p.toString();
            String id = String.valueOf(nextId.getAndIncrement());
            if (isDir) {
                FileNode node = new FileNode(id, name, p.toString(), "folder");
                try (DirectoryStream<Path> ds = Files.newDirectoryStream(p)) {
                    for (Path child : ds) {
                        try {
                            node.addChild(nodeForPath(child));
                        } catch (Exception ignored) {
                            // skip unreadable children
                        }
                    }
                } catch (IOException ioe) {
                    // unable to read directory contents; leave children empty
                }
                return node;
            } else {
                return new FileNode(id, name, p.toString(), "file");
            }
        } catch (Exception e) {
            // In case path does not exist or permission issues, return a placeholder file node
            String id = String.valueOf(nextId.getAndIncrement());
            return new FileNode(id, p.getFileName() != null ? p.getFileName().toString() : p.toString(), p.toString(), "file");
        }
    }
}
