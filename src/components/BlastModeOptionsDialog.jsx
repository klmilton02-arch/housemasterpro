import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, Square } from "lucide-react";

export default function BlastModeOptionsDialog({ open, onOpenChange, timeLeft, onContinue, onRestart, onStop }) {
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Blast Mode Active
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">
          Time remaining: <span className="font-semibold text-foreground">{mins}:{secs}</span>
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <Button variant="outline" className="justify-start gap-2" onClick={() => { onContinue(); onOpenChange(false); }}>
            <Zap className="w-4 h-4 text-orange-500" />
            Continue Blast
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => { onRestart(); onOpenChange(false); }}>
            <RefreshCw className="w-4 h-4 text-blue-500" />
            Restart Blast (30 min)
          </Button>
          <Button variant="outline" className="justify-start gap-2 text-destructive hover:text-destructive" onClick={() => { onStop(); onOpenChange(false); }}>
            <Square className="w-4 h-4" />
            Stop Blast
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}