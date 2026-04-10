import { useCallback, useState } from "react";
import { Upload, FileImage, FileText, File } from "lucide-react";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".docx"];

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <FileImage className="h-5 w-5 text-primary" />;
  if (type === "application/pdf") return <FileText className="h-5 w-5 text-destructive" />;
  return <File className="h-5 w-5 text-primary" />;
};

const FileDropZone = ({ onFilesSelected, disabled, compact }: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      );
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      );
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
        or click to browse • JPG, PNG, PDF, DOCX
      </p>
    </label>
  );
};

export { FileDropZone, getFileIcon };
