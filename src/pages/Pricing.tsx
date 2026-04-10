import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const packs = [
  { credits: 10, price: "$2.99", perCredit: "$0.30", popular: false },
  { credits: 50, price: "$9.99", perCredit: "$0.20", popular: true },
  { credits: 100, price: "$14.99", perCredit: "$0.15", popular: false },
  { credits: 500, price: "$49.99", perCredit: "$0.10", popular: false },
];

const included = [
  "Clean JPG, PNG, PDF, DOCX files",
  "Full metadata preview before cleaning",
  "Warnings for non-removable metadata",
  "Files auto-deleted after 1 hour",
  "Download cleaned files instantly",
  "Processing history in dashboard",
];

const Pricing = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />

    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 animate-fade-in-up">
            Simple pay-per-use pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in-up stagger-1">
            Buy credits and use them whenever you need. 1 credit = 1 file cleaned.
            No subscriptions, no hidden fees.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 rounded-full px-4 py-2 animate-fade-in stagger-2">
            <Sparkles className="h-4 w-4 text-primary" />
            3 free cleans per day — no account needed
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {packs.map((p, i) => (
            <div
              key={p.credits}
              className={`glass rounded-lg p-6 flex flex-col relative hover-lift animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${
                p.popular ? "border-primary/50 glow-primary-sm" : ""
              }`}
            >
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 animate-scale-in">Most Popular</Badge>
              )}
              <div className="text-4xl font-heading font-bold text-foreground mb-1">
                {p.credits}
              </div>
              <div className="text-sm text-muted-foreground mb-4">credits</div>
              <div className="text-2xl font-heading font-bold text-foreground mb-1">
                {p.price}
              </div>
              <div className="text-xs text-muted-foreground mb-6">{p.perCredit} per credit</div>
              <Button className={`mt-auto hover-lift ${p.popular ? "glow-primary-sm" : ""}`} variant={p.popular ? "default" : "outline"}>
                Buy Credits
              </Button>
            </div>
          ))}
        </div>

        <div className="glass rounded-lg p-8 max-w-2xl mx-auto animate-fade-in-up">
          <h3 className="text-xl font-heading font-semibold mb-4">Every credit includes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {included.map((item, i) => (
              <div
                key={item}
                className={`flex items-start gap-2 animate-fade-in stagger-${Math.min(i + 1, 8)}`}
              >
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Pricing;
