import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Share, MoreVertical, PlusSquare, Check } from "lucide-react";
import techrolaLogo from "@/assets/techrola_logo.webp";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">App Installed!</h1>
          <p className="text-muted-foreground">Techrola is installed on your device. Open it from your home screen.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-md">
        <div className="text-center mb-8">
          <img src={techrolaLogo} alt="Techrola Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Install Techrola App</h1>
          <p className="text-muted-foreground text-sm">Install for quick access — works like a native app!</p>
        </div>

        {deferredPrompt ? (
          <Button size="lg" className="w-full text-lg py-6 mb-6" onClick={handleInstall}>
            <Download className="h-5 w-5 mr-2" /> Install Now
          </Button>
        ) : isIOS ? (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> How to install on iPhone
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">1</div>
                  <p className="text-sm pt-1">Tap the <Share className="h-4 w-4 inline text-primary" /> <strong>Share</strong> button in Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">2</div>
                  <p className="text-sm pt-1">Scroll down and tap <PlusSquare className="h-4 w-4 inline text-primary" /> <strong>Add to Home Screen</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">3</div>
                  <p className="text-sm pt-1">Tap <strong>Add</strong> to confirm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> How to install on Android
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">1</div>
                  <p className="text-sm pt-1">Tap <MoreVertical className="h-4 w-4 inline text-primary" /> <strong>Menu</strong> (3 dots) in Chrome</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">2</div>
                  <p className="text-sm pt-1">Tap <Download className="h-4 w-4 inline text-primary" /> <strong>Install app</strong> or <strong>Add to Home screen</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">3</div>
                  <p className="text-sm pt-1">Tap <strong>Install</strong> to confirm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>✅ No app store needed</p>
          <p>✅ Works on Android & iPhone</p>
          <p>✅ Lightweight & fast</p>
        </div>
      </div>
    </Layout>
  );
};

export default Install;