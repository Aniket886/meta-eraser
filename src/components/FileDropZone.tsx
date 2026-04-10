import { useCallback, useState } from "react";
import { Upload, FileImage, FileText, File, Music, Film } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "audio/mpeg",
  "audio/mp3",
  "video/mp4",
  "video/quicktime",
  "application/json",
  "application/xml",
  "text/xml",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
];

const isAcceptedFile = (file: File): boolean => {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
};

const ACCEPTED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".heic", ".heif",
  ".pdf", ".docx", ".xlsx", ".pptx",
  ".mp3", ".mp4", ".mov",
  ".json", ".xml", ".txt",
  ".zip",
];

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <FileImage className="h-5 w-5 text-primary" />;
  if (type === "application/pdf") return <FileText className="h-5 w-5 text-destructive" />;
  if (type.startsWith("audio/")) return <Music className="h-5 w-5 text-primary" />;
  if (type.startsWith("video/")) return <Film className="h-5 w-5 text-primary" />;
  return <File className="h-5 w-5 text-primary" />;
};

const FileDropZone = ({ onFilesSelected, disabled, compact }: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile);
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(isAcceptedFile);
      if (files.length) onFilesSelected(files);
    }
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer
        ${isDragging ? "border-primary bg-primary/10 glow-primary" : "border-border hover:border-primary/50 hover:bg-accent/30"}
        ${compact ? "p-6" : "p-12"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        type="file"
        className="hidden"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        multiple
        onChange={handleChange}
        disabled={disabled}
      />
      <Upload className={`text-muted-foreground mb-3 ${compact ? "h-8 w-8" : "h-12 w-12"} ${isDragging ? "text-primary animate-float" : ""}`} />
      <p className="text-foreground font-medium text-center">
        {isDragging ? "Drop files here" : "Drag & drop files here"}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        or click to browse • JPG, PNG, TIFF, HEIC, PDF, DOCX, XLSX, PPTX, MP3, MP4, MOV, JSON, XML, TXT, ZIP
      </p>
    </label>
  );
};

export { FileDropZone, getFileIcon };
