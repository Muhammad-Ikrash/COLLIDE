package DTOs;

import java.util.List;

public class SetCollaborativeFilesRequest {
    private List<FileSelection> files;

    public SetCollaborativeFilesRequest() {}

    public List<FileSelection> getFiles() { return files; }
    public void setFiles(List<FileSelection> files) { this.files = files; }

    public static class FileSelection {
        private String path;
        private String filename;
        private boolean isDirectory;

        public FileSelection() {}

        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }

        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }

        public boolean isDirectory() { return isDirectory; }
        public void setDirectory(boolean isDirectory) { this.isDirectory = isDirectory; }
    }
}
