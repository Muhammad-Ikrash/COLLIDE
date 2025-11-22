package Controllers;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class FileNode {
    private String id;
    private String name;
    private String path;
    private String type; // "file" or "folder"
    private List<FileNode> children;

    public FileNode() {}

    public FileNode(String id, String name, String path, String type) {
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = type;
        if ("folder".equals(type)) this.children = new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<FileNode> getChildren() { return children; }
    public void setChildren(List<FileNode> children) { this.children = children; }

    public void addChild(FileNode child) {
        if (this.children == null) this.children = new ArrayList<>();
        this.children.add(child);
    }
}
