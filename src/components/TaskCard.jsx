import { useState, useRef } from "react";
import { Check, Clock, AlertTriangle, Calendar, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { getTaskPoints } from "@/utils/gamification";

function getStatusInfo(task) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(task.next_due_date);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(due, today);
  const graceDays = task.overdue_grace_days || 3;

  if (task.status === "Completed" && daysUntilDue > 0) {
    return { label: "Completed", color: "bg-green-100 text-green-700", icon: Check, priority: 3 };
  }
  if (daysUntilDue < -graceDays) {
    return { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertTriangle, priority: 0 };
  }
  if (daysUntilDue < 0) {
    return { label: "Past Due", color: "bg-orange-100 text-orange-700", icon: Clock, priority: 1 };
  }
  if (daysUntilDue <= 3) {
    return { label: "Due Soon", color: "bg-amber-100 text-amber-700", icon: Clock, priority: 1 };
  }
  return { label: "Upcoming", color: "bg-blue-100 text-blue-700", icon: Calendar, priority: 2 };
}

function formatFrequency(days) {
  if (days === 1) return "Daily";
  if (days <= 3) return `Every ${days} days`;
  if (days === 7) return "Weekly";
  if (days === 14) return "Bi-weekly";
  if (days === 30) return "Monthly";
  if (days === 90) return "Quarterly";
  if (days === 180) return "Every 6 months";
  if (days === 365) return "Annually";
  return `Every ${days} days`;
}

export { getStatusInfo, formatFrequency };

export default function TaskCard({ task, onComplete, onRenamed }) {
  const status = getStatusInfo(task);
  const StatusIcon = status.icon;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const inputRef = useRef(null);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === task.name) { setEditing(false); setName(task.name); return; }
    await base44.entities.Task.update(task.id, { name: trimmed });
    setEditing(false);
    onRenamed?.();
  }

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-2 sm:p-3 hover:shadow-md transition-all group w-full",
      status.priority === 0 && "border-red-200 bg-red-50/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            {task.task_type === "Deep Cleaning" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Deep</span>
            )}
          </div>
          {editing ? (
            <input
              ref={inputRef}
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditing(false); setName(task.name); } }}
              className="font-heading font-semibold text-sm text-foreground w-full border border-primary rounded px-1 py-0.5 outline-none bg-background"
            />
          ) : (
            <div className="flex items-center gap-1 group/name">
              <h3 className="font-heading font-semibold text-sm text-foreground truncate">{name}</h3>
              <button
                onClick={e => { e.stopPropagation(); setEditing(true); }}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(parseISO(task.next_due_date), "MMM d, yyyy")}
            </span>
            <span>·</span>
            <span>{formatFrequency(task.frequency_days)}</span>
          </div>
          {task.assigned_to_name && (
            <p className="text-xs text-muted-foreground mt-1">Assigned to <span className="font-medium text-foreground">{task.assigned_to_name}</span></p>
          )}
          <p className="text-xs font-semibold text-primary mt-1">+{getTaskPoints(task)} XP</p>
        </div>
        {status.label !== "Completed" && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 h-8 w-8 p-0 rounded-full border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
            onClick={() => onComplete(task)}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}