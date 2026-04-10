import Navbar from "@/components/Navbar";
import CleanButton from "@/components/CleanButton";
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
  FileDown, ClipboardList, Archive, FileText, Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { extractMetadata, cleanFile, downloadBlob, type MetadataMap } from "@/lib/metadata";
import { generateAuditReport, downloadAuditReport, downloadBatchAuditReport, type AuditReport } from "@/lib/audit";
import { isZip, processZip, type ZipEntry } from "@/lib/zip-processor";
import { loadSettings } from "@/lib/privacy-settings";
import { useToast } from "@/hooks/use-toast";
import { addHistoryEntry } from "@/lib/processing-history";
import { getCredits, useCredit, hasCreditsAvailable, availableCleans, type UserCredits } from "@/lib/credits";
import { useAuth } from "@/hooks/useAuth";
import { generatePdfReport } from "@/lib/pdf-report";
import { supabase } from "@/integrations/supabase/client";
import { isPWA } from "@/lib/pwa-utils";

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
  isZip?: boolean;
  zipEntries?: ZipEntry[];
}

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
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load credits
  useEffect(() => {
    if (user) {
      getCredits(user.id).then(setCredits);
    }
  }, [user]);

  const settings = loadSettings();
  const retentionMs = (settings.retentionMinutes || 60) * 60 * 1000;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFiles((prev) => prev.filter((f) => now - f.addedAt < retentionMs));
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, [retentionMs]);

  const handleFiles = useCallback(async (selectedFiles: File[]) => {
    const newJobs: FileJob[] = selectedFiles.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type,
      size: f.size,
      status: "scanning" as const,
      addedAt: Date.now(),
      originalFile: f,
      isZip: isZip(f),
    }));

    setFiles((prev) => [...newJobs, ...prev]);

    for (const job of newJobs) {
      try {
        if (job.isZip) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === job.id ? { ...f, status: "scanned" as const, warnings: ["ZIP archive — click Clean to process all files inside."] } : f
            )
          );
        } else {
          const { metadata, warnings } = await extractMetadata(job.originalFile);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === job.id ? { ...f, status: "scanned" as const, metadata, warnings } : f
            )
          );
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === job.id ? { ...f, status: "failed" as const, warnings: ["Failed to scan."] } : f
          )
        );
      }
    }
  }, []);

  const handleClean = useCallback(async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file || !user) return;

    // Credit check
    if (credits && !hasCreditsAvailable(credits)) {
      toast({ title: "No credits remaining", description: "Purchase more credits to continue cleaning files.", variant: "destructive" });
      return;
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "cleaning" as const, metadataBefore: f.metadata ? { ...f.metadata } : undefined } : f))
    );

    try {
      // Deduct credit
      await useCredit(user.id);

      if (file.isZip) {
        const result = await processZip(file.originalFile, settings, (current, total) => {
          setBatchProgress(`Processing ${current} of ${total} in ZIP...`);
        });
        setBatchProgress(null);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: "cleaned" as const, cleanedBlob: result.cleanedBlob, zipEntries: result.entries, warnings: [] }
              : f
          )
        );
        const processed = result.entries.filter((e) => e.supported).length;
        await addHistoryEntry({ fileName: file.name, fileType: file.type, fileSize: file.size, fieldsRemoved: processed });
        toast({ title: "ZIP cleaned!", description: `${processed} files processed inside ${file.name}.` });
      } else {
        const metadataBefore = file.metadata ? { ...file.metadata } : {};
        const cleanedBlob = await cleanFile(file.originalFile, settings);
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
        await addHistoryEntry({ fileName: file.name, fileType: file.type, fileSize: file.size, fieldsRemoved: auditReport.summary.removed });
        toast({ title: "File cleaned!", description: `${file.name} metadata has been removed.` });
      }

      // Refresh credits
      getCredits(user.id).then(setCredits);
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "failed" as const, warnings: ["Cleaning failed."] } : f
        )
      );
      toast({ title: "Cleaning failed", description: `Could not clean ${file.name}.`, variant: "destructive" });
    }
  }, [files, toast, settings, user, credits]);

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
      const cleanName = file.isZip ? file.name.replace(/\.zip$/i, "_clean.zip") : file.name.replace(/(\.[^.]+)$/, "_clean$1");
      downloadBlob(file.cleanedBlob!, cleanName);
    }
  }, [files]);

  const handleDownloadAllAudits = useCallback(() => {
    const reports = files.filter((f) => f.auditReport).map((f) => f.auditReport!);
    if (reports.length) downloadBatchAuditReport(reports);
  }, [files]);

  const fetchAiInsights = useCallback(async (reports: AuditReport[]): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report-insights', {
        body: { reports },
      });
      if (error) {
        console.error('AI insights error:', error);
        toast({ title: "AI insights unavailable", description: "Generating PDF without AI analysis.", variant: "destructive" });
        return undefined;
      }
      return data?.insights;
    } catch (e) {
      console.error('AI insights fetch failed:', e);
      return undefined;
    }
  }, [toast]);

  const handleDownloadPdfReport = useCallback(async (report: AuditReport) => {
    setGeneratingPdf(report.filename);
    try {
      const insights = await fetchAiInsights([report]);
      generatePdfReport([report], { userName: user?.user_metadata?.full_name, userEmail: user?.email, aiInsights: insights });
      toast({ title: "PDF Downloaded", description: "Report with AI insights saved." });
    } finally {
      setGeneratingPdf(null);
    }
  }, [user, fetchAiInsights, toast]);

  const handleDownloadAllPdfReports = useCallback(async () => {
    const reports = files.filter((f) => f.auditReport).map((f) => f.auditReport!);
    if (!reports.length) return;
    setGeneratingPdf("__all__");
    try {
      const insights = await fetchAiInsights(reports);
      generatePdfReport(reports, { userName: user?.user_metadata?.full_name, userEmail: user?.email, aiInsights: insights });
      toast({ title: "PDF Downloaded", description: "Report with AI insights saved." });
    } finally {
      setGeneratingPdf(null);
    }
  }, [files, user, fetchAiInsights, toast]);

  const handleDownload = useCallback((file: FileJob) => {
    if (!file.cleanedBlob) return;
    const cleanName = file.isZip ? file.name.replace(/\.zip$/i, "_clean.zip") : file.name.replace(/(\.[^.]+)$/, "_clean$1");
    downloadBlob(file.cleanedBlob, cleanName);
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeLeft = (addedAt: number) => {
    const remaining = retentionMs - (Date.now() - addedAt);
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Upload files and remove metadata.</p>
            </div>
            <div className="glass rounded-lg px-4 py-3 flex items-center gap-3 animate-scale-in stagger-1">
              <Coins className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Credits</div>
                <div className="text-xl font-heading font-bold">{credits ? availableCleans(credits) : "…"}</div>
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="mb-8 animate-fade-in-up stagger-2">
            <FileDropZone onFilesSelected={handleFiles} />
          </div>

          {/* Batch Actions */}
          {files.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
              <h2 className="text-xl font-heading font-semibold mr-auto">
                Files <span className="text-muted-foreground text-sm font-normal">({files.length})</span>
              </h2>

              {batchProgress && (
                <span className="text-sm text-primary animate-pulse">{batchProgress}</span>
              )}

              {scannedCount > 0 && (
                <CleanButton
                  onClick={handleCleanAll}
                  label={`Clean All (${scannedCount})`}
                  activeLabel="Cleaning..."
                  size="sm"
                />
              )}
              {cleanedCount > 0 && (
                <Button size="sm" variant="outline" className="animate-scale-in" onClick={handleDownloadAll}>
                  <FileDown className="h-4 w-4 mr-1" /> Download All ({cleanedCount})
                </Button>
              )}
              {auditCount > 0 && (
                <Button size="sm" variant="outline" className="animate-scale-in" onClick={handleDownloadAllAudits}>
                  <ClipboardList className="h-4 w-4 mr-1" /> Audit Reports ({auditCount})
                </Button>
              )}
              {auditCount > 0 && (
                <Button size="sm" variant="outline" className="animate-scale-in" onClick={handleDownloadAllPdfReports} disabled={generatingPdf === "__all__"}>
                  {generatingPdf === "__all__" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />} PDF Report ({auditCount})
                </Button>
              )}
            </div>
          )}

          {/* File Queue */}
          {files.length > 0 && (
            <div className="space-y-4">
              {files.map((file, i) => (
                <Collapsible key={file.id}>
                  <div
                    className={`glass rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/20 animate-fade-in-up`}
                    style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="transition-transform duration-200 hover:scale-110">
                        {file.isZip ? <Archive className="h-5 w-5 text-primary" /> : getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                          {file.isZip && <Badge variant="secondary" className="text-xs">ZIP</Badge>}
                        </div>
                        {(file.status === "scanning" || file.status === "cleaning") && (
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full animate-progress-fill" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatTimeLeft(file.addedAt)}
                      </div>
                      <Badge className={`${statusColors[file.status]} transition-colors duration-300`}>{file.status}</Badge>
                      {file.warnings && file.warnings.length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 animate-pulse" />
                      )}
                      {file.status === "scanned" && (
                        <CleanButton
                          onClick={() => handleClean(file.id)}
                          label="Clean"
                          activeLabel="Cleaning"
                          size="sm"
                        />
                      )}
                      {file.status === "cleaned" && (
                        <>
                          <Button size="sm" variant="outline" className="shrink-0 hover-lift" onClick={() => handleDownload(file)}>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                          {file.auditReport && (
                            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => downloadAuditReport(file.auditReport!)}>
                              <ClipboardList className="h-4 w-4 mr-1" /> Audit
                            </Button>
                          )}
                          {file.auditReport && (
                            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => handleDownloadPdfReport(file.auditReport!)} disabled={generatingPdf === file.auditReport!.filename}>
                              {generatingPdf === file.auditReport!.filename ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />} PDF
                            </Button>
                          )}
                        </>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button size="icon" variant="ghost" className="shrink-0 transition-transform duration-200 data-[state=open]:rotate-180">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-destructive transition-colors duration-200" onClick={() => removeFile(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                      <div className="border-t border-border/50 p-4">
                        {file.warnings && file.warnings.length > 0 && (
                          <div className="flex items-start gap-2 bg-warning/10 text-warning rounded-md p-3 mb-4 text-sm animate-fade-in">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>{file.warnings.join(" ")}</div>
                          </div>
                        )}

                        {/* Audit summary */}
                        {file.auditReport && (
                          <div className="flex gap-4 mb-4 text-sm animate-fade-in">
                            <span className="text-success">✓ {file.auditReport.summary.removed} removed</span>
                            <span className="text-muted-foreground">• {file.auditReport.summary.kept} kept</span>
                          </div>
                        )}

                        {/* ZIP entries */}
                        {file.zipEntries && file.zipEntries.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Files in archive ({file.zipEntries.length})</h4>
                            <div className="space-y-2">
                              {file.zipEntries.map((entry, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 text-sm bg-accent/30 rounded-md px-3 py-2 animate-fade-in"
                                  style={{ animationDelay: `${i * 0.03}s` }}
                                >
                                  <span className="truncate flex-1">{entry.name}</span>
                                  <span className="text-xs text-muted-foreground">{formatSize(entry.size)}</span>
                                  {entry.supported ? (
                                    entry.auditReport ? (
                                      <span className="text-xs text-success">✓ {entry.auditReport.summary.removed} stripped</span>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">Supported</Badge>
                                    )
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Skipped</Badge>
                                  )}
                                  {entry.warnings?.map((w, j) => (
                                    <span key={j} className="text-xs text-warning">{w}</span>
                                  ))}
                                </div>
                              ))}
                            </div>
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
                              {Object.entries(file.metadata).map(([key, val], i) => (
                                <TableRow
                                  key={key}
                                  className="animate-fade-in"
                                  style={{ animationDelay: `${i * 0.02}s` }}
                                >
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
                          !file.zipEntries && <p className="text-sm text-muted-foreground">No metadata detected.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <div className="text-center text-muted-foreground py-16 animate-fade-in stagger-3">
              <p className="text-lg">No files yet. Upload a file to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
