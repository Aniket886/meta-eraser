import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { User, Lock, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getHistory, clearHistory, type ProcessingRecord } from "@/lib/processing-history";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [history, setHistory] = useState<ProcessingRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    getHistory().then((records) => {
      setHistory(records);
      setLoadingHistory(false);
    });
  }, []);

  const initials = (displayName || user?.email || "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  const handleUpdateName = async () => {
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    setSavingName(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Display name updated" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
    toast({ title: "History cleared" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-8">
          <h1 className="text-3xl font-heading font-bold animate-fade-in">Profile</h1>

          {/* Account Settings */}
          <div className="glass rounded-xl p-6 space-y-6 animate-fade-in-up stagger-1">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 text-lg">
                <AvatarFallback className="bg-primary/20 text-primary font-heading font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Account Settings
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <Button onClick={handleUpdateName} disabled={savingName} className="shrink-0">
                  {savingName ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>

            <div className="border-t border-border/50 pt-6 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" /> Change Password
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Update Password"}
              </Button>
            </div>
          </div>

          {/* Processing History */}
          <div className="glass rounded-xl p-6 space-y-4 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Processing History
              </h2>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleClearHistory}>
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No files cleaned yet. Head to the Dashboard to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Fields Removed</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium truncate max-w-[200px]">{r.file_name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatSize(r.file_size)}</TableCell>
                      <TableCell>{r.fields_removed}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(r.cleaned_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
