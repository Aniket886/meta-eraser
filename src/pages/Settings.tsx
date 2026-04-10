import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings2, Download, Upload, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  loadSettings, saveSettings, exportSettings, importSettings,
  DEFAULT_SETTINGS, PRESETS, type PrivacySettings,
} from "@/lib/privacy-settings";
import { useToast } from "@/hooks/use-toast";

const TOGGLE_OPTIONS: { key: keyof PrivacySettings; label: string; description: string }[] = [
  { key: "stripGps", label: "GPS / Location", description: "Latitude, longitude, altitude coordinates" },
  { key: "stripAuthor", label: "Author / Creator", description: "Author name, creator, company, last modified by" },
  { key: "stripDates", label: "Dates", description: "Creation date, modification date, year" },
  { key: "stripCamera", label: "Camera / Device", description: "Camera make, model, lens, exposure settings" },
  { key: "stripSoftware", label: "Software", description: "Application name, version, producer" },
  { key: "stripComments", label: "Comments / Descriptions", description: "Title, subject, description, comments" },
  { key: "stripAlbumArt", label: "Album Art", description: "Embedded cover images in audio files" },
];

const RETENTION_OPTIONS = [
  { value: "0", label: "Immediate (no retention)" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
];

const Settings = () => {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = (partial: Partial<PrivacySettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  };

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      update(preset.settings);
      toast({ title: `${preset.label} preset applied` });
    }
  };

  const handleExport = () => {
    const json = exportSettings(settings);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metaclean-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Settings exported" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importSettings(reader.result as string);
        setSettings(imported);
        saveSettings(imported);
        toast({ title: "Settings imported" });
      } catch {
        toast({ title: "Invalid settings file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    saveSettings({ ...DEFAULT_SETTINGS });
    toast({ title: "Settings reset to defaults" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <Settings2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-heading font-bold">Privacy Settings</h1>
              <p className="text-muted-foreground">Control which metadata categories to strip.</p>
            </div>
          </div>

          {/* Presets */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Presets</CardTitle>
              <CardDescription>Quick-apply a privacy profile.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key)}>
                  <Badge variant="secondary" className="mr-2">{preset.label}</Badge>
                  {preset.description}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Toggles */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Metadata Categories</CardTitle>
              <CardDescription>Enable to strip, disable to keep.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {TOGGLE_OPTIONS.map((opt) => (
                <div key={opt.key} className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm font-medium">{opt.label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                  <Switch
                    checked={settings[opt.key] as boolean}
                    onCheckedChange={(checked) => update({ [opt.key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Retention */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Data Retention</CardTitle>
              <CardDescription>How long files stay before auto-delete.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={String(settings.retentionMinutes)}
                onValueChange={(v) => update({ retentionMinutes: Number(v) })}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Import / Export / Reset */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Team Sharing</CardTitle>
              <CardDescription>Export or import settings as JSON for your team.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset Defaults
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
