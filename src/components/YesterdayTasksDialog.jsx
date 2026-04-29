import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function YesterdayTasksDialog({ tasks, onComplete, onClose }) {
  const [checked, setChecked] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDone() {
    setSubmitting(true);
    const toComplete = tasks.filter(t => checked.has(t.id));
    for (const task of toComplete) {
      await onComplete(task);
    }
    setSubmitting(false);
    onClose();
  }

  if (!tasks || tasks.length === 0) return null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Did you do these yesterday?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            These tasks were due yesterday. Check off any you completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
          {tasks.map(task => {
            const isChecked = checked.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => toggle(task.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  isChecked
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  isChecked ? "border-green-500 bg-green-500" : "border-muted-foreground/40"
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                  <p className="text-xs text-muted-foreground">{task.category}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={handleDone}
            disabled={submitting}
          >
            {submitting ? "Saving..." : checked.size > 0 ? `Mark ${checked.size} Done` : "None Done"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}