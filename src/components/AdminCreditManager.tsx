import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Loader2, Coins } from "lucide-react";

interface UserCreditResult {
  userId: string;
  email: string;
  displayName: string;
  balance: number;
}

const AdminCreditManager = () => {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<UserCreditResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setSearching(true);
    setResult(null);

    try {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .ilike("email", trimmed)
        .maybeSingle();

      if (profileErr || !profile) {
        toast({ title: "User not found", description: `No user with email "${trimmed}"`, variant: "destructive" });
        setSearching(false);
        return;
      }

      const { data: credits } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", profile.id)
        .maybeSingle();

      setResult({
        userId: profile.id,
        email: profile.email || trimmed,
        displayName: profile.display_name || "—",
        balance: credits?.balance ?? 0,
      });
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleAddCredits = async (add: boolean) => {
    if (!result) return;
    const credits = parseInt(amount);
    if (!credits || credits <= 0) {
      toast({ title: "Enter a valid number of credits", variant: "destructive" });
      return;
    }

    setUpdating(true);
    try {
      const newBalance = add
        ? result.balance + credits
        : Math.max(0, result.balance - credits);

      const { data: existing } = await supabase
        .from("user_credits")
        .select("user_id")
        .eq("user_id", result.userId)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("user_credits")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", result.userId));
      } else {
        ({ error } = await supabase
          .from("user_credits")
          .insert({
            user_id: result.userId,
            balance: newBalance,
            free_cleans_today: 0,
            last_free_reset: new Date().toISOString().slice(0, 10),
          }));
      }

      if (error) throw error;

      setResult({ ...result, balance: newBalance });
      setAmount("");
      toast({ title: `${add ? "Added" : "Removed"} ${credits} credits`, description: `New balance: ${newBalance}` });
    } catch (err: any) {
      toast({ title: "Failed to update credits", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-heading font-semibold">Manage Credits</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search user by email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} disabled={searching} variant="secondary">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {result && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{result.displayName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{result.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-heading font-bold text-primary">{result.balance}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Credits amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="max-w-[160px]"
            />
            <Button onClick={() => handleAddCredits(true)} disabled={updating} size="sm">
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
            <Button onClick={() => handleAddCredits(false)} disabled={updating} variant="outline" size="sm">
              <Minus className="h-4 w-4" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreditManager;
