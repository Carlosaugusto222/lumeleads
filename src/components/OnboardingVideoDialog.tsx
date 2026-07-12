import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import videoAsset from "@/assets/sitelume-tutorial.mp4.asset.json";

const STORAGE_KEY = "sitelume:onboarding-seen";

export function OnboardingVideoDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {}
  }, []);

  function close() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao Sitelume</DialogTitle>
          <DialogDescription>
            Assista este vídeo rápido para conhecer o básico: buscar leads, gerenciar no CRM e criar sites com IA.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-border/50 bg-black">
          <video
            src={videoAsset.url}
            controls
            autoPlay
            playsInline
            className="h-auto w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>Pular</Button>
          <Button onClick={close}>Começar a usar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
