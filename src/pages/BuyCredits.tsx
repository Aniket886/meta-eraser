import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Star, Crown, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getCredits, type UserCredits } from "@/lib/credits";
import { supabase } from "@/integrations/supabase/client";

const CREDIT_PACKS = [
  { id: "starter", name: "Starter", credits: 10, price: 2.99, icon: Zap, popular: false },
  { id: "pro", name: "Pro Pack", credits: 50, price: 9.99, icon: Star, popular: true },
  { id: "power", name: "Power Pack", credits: 150, price: 19.99, icon: Crown, popular: false },
];

const BuyCredits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (user) getCredits(user.id).then(setCredits);
  }, [user]);

  const handlePurchase = async (pack: typeof CREDIT_PACKS[0]) => {
    if (!user) return;
    setPurchasing(pack.id);

    try {
      // Simulated purchase — adds credits directly
      const current = credits?.balance ?? 0;
      const { error } = await supabase
        .from("user_credits")
        .update({ balance: current + pack.credits, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setCredits((prev) => prev ? { ...prev, balance: prev.balance + pack.credits } : prev);
      toast({ title: "Credits added!", description: `${pack.credits} credits have been added to your account.` });
    } catch {
      toast({ title: "Purchase failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setPurchasing(null);
    }
  };

  const freeRemaining = credits ? Math.max(0, 3 - credits.free_cleans_today) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl font-heading font-bold mb-3">Buy Credits</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Each credit lets you clean one file. Pick a pack that suits your needs.
            </p>
            {credits && (
              <div className="mt-6 inline-flex items-center gap-3 glass rounded-lg px-5 py-3">
                <Coins className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Current balance</div>
                  <div className="text-xl font-heading font-bold">{credits.balance} credits</div>
                </div>
                <span className="text-xs text-muted-foreground ml-2">+ {freeRemaining} free today</span>
              </div>
            )}
          </div>

          {/* Packs */}
          <div className="grid gap-6 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack, i) => {
              const Icon = pack.icon;
              return (
                <div
                  key={pack.id}
                  className={`relative glass rounded-xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:border-primary/30 hover-lift animate-fade-in-up ${
                    pack.popular ? "border-primary/40 ring-1 ring-primary/20" : ""
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {pack.popular && (
                    <Badge className="absolute -top-3 bg-primary text-primary-foreground text-xs px-3">
                      Most Popular
                    </Badge>
                  )}
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
                    pack.popular ? "bg-primary/20" : "bg-accent"
                  }`}>
                    <Icon className={`h-6 w-6 ${pack.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-lg font-heading font-semibold mb-1">{pack.name}</h3>
                  <div className="text-3xl font-heading font-bold mb-1">{pack.credits}</div>
                  <div className="text-sm text-muted-foreground mb-4">credits</div>
                  <div className="text-2xl font-bold mb-6">${pack.price}</div>
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6 w-full">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {pack.credits} file cleans</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Never expires</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Audit reports included</li>
                  </ul>
                  <Button
                    className={`w-full ${pack.popular ? "glow-primary-sm" : ""}`}
                    variant={pack.popular ? "default" : "outline"}
                    disabled={purchasing !== null}
                    onClick={() => handlePurchase(pack)}
                  >
                    {purchasing === pack.id ? "Processing…" : "Buy Now"}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-in">
            Payments are simulated for demo purposes. Stripe integration coming soon.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BuyCredits;
