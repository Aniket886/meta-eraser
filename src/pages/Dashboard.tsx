import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropZone, getFileIcon } from "@/components/FileDropZone";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Coins, Download, Sparkles, ChevronDown, AlertTriangle, Trash2, Clock,
  FileDown, ClipboardList,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { extractMetadata, cleanFile, downloadBlob, type MetadataMap } from "@/lib/metadata";
import { generateAuditReport, downloadAuditReport, downloadBatchAuditReport, type AuditReport } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";

interface FileJob {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "scanning" | "scanned" | "cleaning" | "cleaned" | "failed";
  metadata?: MetadataMap;
  metadataBefore?: MetadataMap;
  warnings?: string[];
  cleanedBlob?: Blob;
  auditReport?: AuditReport;
  addedAt: number;
  originalFile: File;
}

const FILE_LIFETIME_MS = 60 * 60 * 1000;

const statusColors: Record<string, string> = {
  scanning: "bg-primary/20 text-primary",
  scanned: "bg-accent text-accent-foreground",
  cleaning: "bg-primary/20 text-primary",
  cleaned: "bg-success/20 text-success",
  failed: "bg-destructive/20 text-destructive",
};

const Dashboard = () => {
  const [files, setFiles] = useState<FileJob[]>([]);
  const [, setTick] = useState(0);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const credits = 5;
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFiles((prev) => prev.filter((f) => now - f.addedAt < FILE_LIFETIME_MS));
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleFiles = useCallback(async (selectedFiles: File[]) => {
    const newJobs: FileJob[] = selectedFiles.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type,
      size: f.size,
      status: "scanning" as const,
      addedAt: Date.now(),
      originalFile: f,
    }));

    setFiles((prev) => [...newJobs, ...prev]);

    for (const job of newJobs) {
      try {
        const { metadata, warnings } = await extractMetadata(job.originalFile);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === job.id ? { ...f, status: "scanned" as const, metadata, warnings } : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === job.id ? { ...f, status: "failed" as const, warnings: ["Failed to scan metadata."] } : f
          )
        );
      }
    }
  }, []);

  const handleClean = useCallback(async (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "cleaning" as const, metadataBefore: f.metadata ? { ...f.metadata } : undefined } : f))
    );

    const file = files.find((f) => f.id === id);
    if (!file) return;

    try {
      const metadataBefore = file.metadata ? { ...file.metadata } : {};
      const cleanedBlob = await cleanFile(file.originalFile);
      const { metadata: afterMeta } = await extractMetadata(
        new File([cleanedBlob], file.name, { type: file.type })
      );
      const auditReport = generateAuditReport(file.name, file.type, file.size, metadataBefore, afterMeta);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "cleaned" as const, cleanedBlob, metadata: afterMeta, metadataBefore, auditReport, warnings: [] }
            : f
        )
      );
      toast({ title: "File cleaned!", description: `${file.name} metadata has been removed.` });
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "failed" as const, warnings: ["Cleaning failed."] } : f
        )
      );
      toast({ title: "Cleaning failed", description: `Could not clean ${file.name}.`, variant: "destructive" });
    }
  }, [files, toast]);

  const handleCleanAll = useCallback(async () => {
    const scannedFiles = files.filter((f) => f.status === "scanned");
    if (!scannedFiles.length) return;

    for (let i = 0; i < scannedFiles.length; i++) {
      setBatchProgress(`Cleaning ${i + 1} of ${scannedFiles.length}...`);
      await handleClean(scannedFiles[i].id);
    }
    setBatchProgress(null);
    toast({ title: "Batch complete!", description: `${scannedFiles.length} files cleaned.` });
  }, [files, handleClean, toast]);

  const handleDownloadAll = useCallback(() => {
    const cleanedFiles = files.filter((f) => f.status === "cleaned" && f.cleanedBlob);
    for (const file of cleanedFiles) {
      const cleanName = file.name.replace(/(\.[^.]+)$/, "_clean$1");
      downloadBlob(file.cleanedBlob!, cleanName);
    }
  }, [files]);

  const handleDownloadAllAudits = useCallback(() => {
    const reports = files.filter((f) => f.auditReport).map((f) => f.auditReport!);
    if (reports.length) downloadBatchAuditReport(reports);
  }, [files]);

  const handleDownload = useCallback((file: FileJob) => {
    if (!file.cleanedBlob) return;
    downloadBlob(file.cleanedBlob, file.name.replace(/(\.[^.]+)$/, "_clean$1"));
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeLeft = (addedAt: number) => {
    const remaining = FILE_LIFETIME_MS - (Date.now() - addedAt);
    if (remaining <= 0) return "Expiring…";
    return `${Math.ceil(remaining / 60_000)}m left`;
  };

  const scannedCount = files.filter((f) => f.status === "scanned").length;
  const cleanedCount = files.filter((f) => f.status === "cleaned").length;
  const auditCount = files.filter((f) => f.auditReport).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Upload files and remove metadata.</p>
            </div>
            <div className="glass rounded-lg px-4 py-3 flex items-center gap-3">
              <Coins className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Credits</div>
                <div className="text-xl font-heading font-bold">{credits}</div>
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="mb-8">
            <FileDropZone onFilesSelected={handleFiles} />
          </div>

          {/* Batch Actions */}
          {files.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-xl font-heading font-semibold mr-auto">
                Files <span className="text-muted-foreground text-sm font-normal">({files.length})</span>
              </h2>

              {batchProgress && (
                <span className="text-sm text-primary animate-pulse">{batchProgress}</span>
              )}

              {scannedCount > 0 && (
                <Button size="sm" className="glow-primary-sm" onClick={handleCleanAll}>
                  <Sparkles className="h-4 w-4 mr-1" /> Clean All ({scannedCount})
                </Button>
              )}
              {cleanedCount > 0 && (
                <Button size="sm" variant="outline" onClick={handleDownloadAll}>
                  <FileDown className="h-4 w-4 mr-1" /> Download All ({cleanedCount})
                </Button>
              )}
              {auditCount > 0 && (
                <Button size="sm" variant="outline" onClick={handleDownloadAllAudits}>
                  <ClipboardList className="h-4 w-4 mr-1" /> Audit Reports ({auditCount})
                </Button>
              )}
            </div>
          )}

          {/* File Queue */}
          {files.length > 0 && (
            <div className="space-y-4">
              {files.map((file) => (
                <Collapsible key={file.id}>
                  <div className="glass rounded-lg overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                        </div>
                        {(file.status === "scanning" || file.status === "cleaning") && (
                          <Progress value={60} className="mt-2 h-1.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatTimeLeft(file.addedAt)}
                      </div>
                      <Badge className={statusColors[file.status]}>{file.status}</Badge>
                      {file.warnings && file.warnings.length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      )}
                      {file.status === "scanned" && (
                        <Button size="sm" className="glow-primary-sm shrink-0" onClick={() => handleClean(file.id)}>
                          <Sparkles className="h-4 w-4 mr-1" /> Clean
                        </Button>
                      )}
                      {file.status === "cleaned" && (
                        <>
                          <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleDownload(file)}>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                          {file.auditReport && (
                            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => downloadAuditReport(file.auditReport!)}>
                              <ClipboardList className="h-4 w-4 mr-1" /> Audit
                            </Button>
                          )}
                        </>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button size="icon" variant="ghost" className="shrink-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <div className="border-t border-border/50 p-4">
                        {file.warnings && file.warnings.length > 0 && (
                          <div className="flex items-start gap-2 bg-warning/10 text-warning rounded-md p-3 mb-4 text-sm">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>{file.warnings.join(" ")}</div>
                          </div>
                        )}

                        {/* Audit summary */}
                        {file.auditReport && (
                          <div className="flex gap-4 mb-4 text-sm">
                            <span className="text-success">✓ {file.auditReport.summary.removed} removed</span>
                            <span className="text-muted-foreground">• {file.auditReport.summary.kept} kept</span>
                          </div>
                        )}

                        {file.metadata && Object.keys(file.metadata).length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Field</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="w-28">Removable</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(file.metadata).map(([key, val]) => (
                                <TableRow key={key}>
                                  <TableCell className="font-medium">{key}</TableCell>
                                  <TableCell className="text-muted-foreground max-w-xs truncate">{val.value}</TableCell>
                                  <TableCell>
                                    <Badge variant={val.removable ? "default" : "secondary"} className="text-xs">
                                      {val.removable ? "Yes" : "No"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">No metadata detected.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-lg">No files yet. Upload a file to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
