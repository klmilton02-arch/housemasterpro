import { useState, useRef } from "react";
import { Check, Clock, AlertTriangle, Calendar, Pencil, Flame, ChevronRight, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";

function getStatusInfo(task) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(task.next_due_date);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(due, today);
  const graceDays = task.overdue_grace_days || 3;

  // Check if due today first (for recurring tasks completed yesterday)
  if (daysUntilDue === 0) {
    if (task.status !== "Completed") {
      return { label: "Due Today", color: "bg-blue-500 text-white", icon: Zap, priority: 1 };
    }
    // If completed, check if it was completed today
    if (task.last_completed_date) {
      const lastCompleted = parseISO(task.last_completed_date);
      lastCompleted.setHours(0, 0, 0, 0);
      const isCompletedToday = differenceInDays(today, lastCompleted) === 0;
      if (!isCompletedToday) {
        // Completed before today, so it's due again today (recurring task)
        return { label: "Due Today", color: "bg-blue-500 text-white", icon: Zap, priority: 1 };
      }
    }
    return { label: "Completed", color: "bg-green-100 text-green-700", icon: Check, priority: 3 };
  }

  if (task.status === "Completed") {
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

export default function TaskCard({ task, onComplete, onRenamed, onViewDetails, isInJustCompleted }) {
  const isCompleted = task.status === "Completed";
  // Local visual state for immediate feedback; doesn't trigger sort until parent updates
  const [visuallyCompleted, setVisuallyCompleted] = useState(isCompleted);
  const status = getStatusInfo({ ...task, status: visuallyCompleted ? "Completed" : task.status });
  const StatusIcon = status.icon;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const inputRef = useRef(null);

  // Sync if parent resets to Pending (e.g. uncomplete from detail modal), but not during animation
  // Never reset visual state while this task is pinned as just-completed
  if (!isCompleted && visuallyCompleted && !isInJustCompleted) {
    setVisuallyCompleted(false);
  }
  // Force visually completed when pinned
  if (isInJustCompleted && !visuallyCompleted) {
    setVisuallyCompleted(true);
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === task.name) { setEditing(false); setName(task.name); return; }
    await base44.entities.Task.update(task.id, { name: trimmed });
    setEditing(false);
    onRenamed?.();
  }

  function handleCheckboxClick(e) {
    e.stopPropagation();
    const nowCompleted = !visuallyCompleted;
    setVisuallyCompleted(nowCompleted);
    onComplete?.(task);
  }

  const cardBg = visuallyCompleted
    ? "border-green-400 bg-green-50/60 dark:border-green-700 dark:bg-green-950/30"
    : {
        "Overdue": "border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30",
        "Past Due": "border-orange-300 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30",
        "Due Soon": "border-yellow-300 bg-yellow-50/60 dark:border-yellow-800 dark:bg-yellow-950/30",
      }[status.label] || "border-border bg-card";

  const showDate = !visuallyCompleted && ["Overdue", "Past Due", "Due Soon"].includes(status.label);

  return (
    <div className={cn(
      "border rounded-lg px-3 hover:shadow-md transition-all group w-full cursor-pointer h-24 flex items-center overflow-hidden",
      cardBg
    )} onClick={() => onViewDetails?.(task)}>
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex-1 min-w-0">
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
              <h3 className={cn("font-heading font-semibold text-sm truncate", visuallyCompleted ? "line-through text-muted-foreground" : "text-foreground")}>{name}</h3>
              <button
                onClick={e => { e.stopPropagation(); setEditing(true); }}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
           <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium", status.color)}>
             <StatusIcon className="w-3 h-3" />
             {status.label}
           </span>
           {showDate && (
             <span className="text-xs text-muted-foreground">{format(parseISO(task.next_due_date), "MMM d")}</span>
           )}
           {task.streak > 0 && (
             <span className="inline-flex items-center gap-0.5 text-xs font-medium text-orange-500">
               <Flame className="w-3 h-3" />{task.streak}
             </span>
           )}
           {task.assigned_to_name && (
             <span className="text-xs text-muted-foreground">· {task.assigned_to_name}</span>
           )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className={`h-7 w-7 flex items-center justify-center rounded-md border-2 transition-all ${
              visuallyCompleted
                ? "border-green-500 bg-green-500"
                : "border-muted-foreground/40 hover:border-primary bg-transparent"
            }`}
            onClick={handleCheckboxClick}
            title={visuallyCompleted ? "Mark incomplete" : "Mark complete"}
          >
            <Check className={`w-4 h-4 transition-opacity ${visuallyCompleted ? "text-white opacity-100" : "opacity-0"}`} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onViewDetails?.(task); }}
            className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            title="View details"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}