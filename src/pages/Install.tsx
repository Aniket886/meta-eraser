import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Monitor, Smartphone, Tablet, Check } from "lucide-react";
import { useState, useEffect } from "react";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const platforms = [
    {
      icon: Monitor,
      title: "Desktop (Chrome / Edge)",
      steps: [
        "Click the install icon in the address bar",
        "Or use the menu → 'Install MetaClean'",
        "The app opens in its own window",
      ],
    },
    {
      icon: Smartphone,
      title: "iOS (Safari)",
      steps: [
        "Tap the Share button",
        "Scroll down and tap 'Add to Home Screen'",
        "Tap 'Add' to confirm",
      ],
    },
    {
      icon: Tablet,
      title: "Android (Chrome)",
      steps: [
        "Tap the three-dot menu",
        "Tap 'Add to Home screen'",
        "Tap 'Install' to confirm",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              Install MetaClean
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Use MetaClean as a desktop or mobile app. Works fully offline — all
              processing happens on your device.
            </p>

            <div className="mt-8">
              {installed ? (
                <Button size="lg" disabled className="glow-primary">
                  <Check className="h-5 w-5 mr-2" /> Installed
                </Button>
              ) : deferredPrompt ? (
                <Button size="lg" className="glow-primary" onClick={handleInstall}>
                  <Download className="h-5 w-5 mr-2" /> Install App
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Use your browser's install option or follow the instructions below.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms.map((p) => (
              <Card key={p.title} className="glass">
                <CardHeader className="text-center">
                  <p.icon className="h-10 w-10 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {p.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center glass rounded-lg p-8">
            <h2 className="text-xl font-heading font-semibold mb-2">Why install?</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              The installed app works offline, opens instantly, and runs in its own
              window. All file processing stays on your device — nothing is uploaded
              to any server.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
