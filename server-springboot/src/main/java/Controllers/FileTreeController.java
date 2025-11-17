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

    @PostMapping("/delete")
    public ResponseEntity<?> deletePath(@RequestBody java.util.Map<String, String> body) {
        try {
            String pathStr = body.get("path");
            if (pathStr == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "path required"));
            }
            Path p = Paths.get(pathStr).toAbsolutePath().normalize();
            Path root = Paths.get(ROOT).toAbsolutePath().normalize();
            if (!p.startsWith(root)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
            }
            if (!Files.exists(p)) {
                return ResponseEntity.status(404).body(java.util.Map.of("error", "Not found"));
            }

            // recursive delete for directories
            if (Files.isDirectory(p)) {
                try (java.util.stream.Stream<Path> walk = Files.walk(p)) {
                    walk.sorted(java.util.Comparator.reverseOrder()).forEach((pp) -> {
                        try {
                            Files.deleteIfExists(pp);
                        } catch (Exception ex) {
                            /* ignore individual delete errors */ }
                    });
                }
            } else {
                Files.deleteIfExists(p);
            }
            return ResponseEntity.ok(java.util.Map.of("path", p.toString()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.toString()));
        }
    }

    @PostMapping("/rename")
    public ResponseEntity<?> renamePath(@RequestBody java.util.Map<String, String> body) {
        try {
            String oldPath = body.get("oldPath");
            String newPath = body.get("newPath");
            if (oldPath == null || newPath == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "oldPath and newPath required"));
            }
            Path oldP = Paths.get(oldPath).toAbsolutePath().normalize();
            Path newP = Paths.get(newPath).toAbsolutePath().normalize();
            Path root = Paths.get(ROOT).toAbsolutePath().normalize();
            if (!oldP.startsWith(root) || !newP.startsWith(root)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
            }
            if (!Files.exists(oldP)) {
                return ResponseEntity.status(404).body(java.util.Map.of("error", "Not found"));
            }

            Files.createDirectories(newP.getParent());
            Files.move(oldP, newP, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(java.util.Map.of("oldPath", oldP.toString(), "newPath", newP.toString()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.toString()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createPath(@RequestBody java.util.Map<String, String> body) {
        try {
            String parent = body.get("parent");
            String name = body.get("name");
            if (parent == null || name == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "parent and name required"));
            }
            Path parentP = Paths.get(parent).toAbsolutePath().normalize();
            Path root = Paths.get(ROOT).toAbsolutePath().normalize();
            if (!parentP.startsWith(root)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
            }
            if (!Files.exists(parentP) || !Files.isDirectory(parentP)) {
                return ResponseEntity.status(404).body(java.util.Map.of("error", "Parent not found or not a directory"));
            }

            // if name has a dot, treat as file, else treat as folder
            boolean isFile = name.contains(".");
            Path newP = parentP.resolve(name).toAbsolutePath().normalize();
            if (!newP.startsWith(root)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
            }
            if (isFile) {
                Files.createDirectories(newP.getParent());
                Files.writeString(newP, "", java.nio.charset.StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.CREATE_NEW);
            } else {
                Files.createDirectories(newP);
            }
            return ResponseEntity.ok(java.util.Map.of("path", newP.toString(), "type", isFile ? "file" : "folder"));
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
