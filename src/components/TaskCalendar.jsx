import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getStatusInfo } from "./TaskCard";

export default function TaskCalendar({ tasks, onViewDetails }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of calendar to align with weekday
  const startPad = monthStart.getDay(); // 0=Sun
  const paddedDays = [...Array(startPad).fill(null), ...days];

  function getTasksForDay(date) {
    return tasks.filter(t => {
      if (!t.next_due_date) return false;
      return isSameDay(parseISO(t.next_due_date), date);
    });
  }

  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-heading font-semibold text-base">{format(currentMonth, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="min-h-[60px] border-b border-r border-border/50 last:border-r-0" />;

          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[60px] border-b border-r border-border/50 p-1 ${(i + 1) % 7 === 0 ? "border-r-0" : ""} ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => {
                  const status = getStatusInfo(task);
                  const dotColor = task.status === "Completed" ? "bg-green-400" : status.label === "Overdue" || status.label === "Past Due" ? "bg-red-400" : "bg-blue-400";
                  return (
                    <button
                      key={task.id}
                      onClick={() => onViewDetails?.(task)}
                      className="w-full text-left"
                    >
                      <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-medium truncate ${task.status === "Completed" ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" : status.label === "Overdue" || status.label === "Past Due" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <span className="truncate">{task.name}</span>
                      </div>
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}