import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getTaskPoints } from "@/utils/gamification";
import { formatFrequency } from "./TaskCard";

export default function CompletedTaskItem({ task }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="font-medium text-sm text-foreground">{task.name}</span>
          {task.assigned_to_name && (
            <span className="text-xs text-muted-foreground hidden sm:inline">· {task.assigned_to_name}</span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Completed</p>
            <p className="font-medium text-foreground mt-0.5">
              {task.last_completed_date ? format(parseISO(task.last_completed_date), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Next Due</p>
            <p className="font-medium text-foreground mt-0.5">
              {task.next_due_date ? format(parseISO(task.next_due_date), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Frequency</p>
            <p className="font-medium text-foreground mt-0.5">{formatFrequency(task.frequency_days)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">XP Earned</p>
            <p className="font-semibold text-primary mt-0.5">+{getTaskPoints(task)} XP</p>
          </div>
        </div>
      )}
    </div>
  );
}