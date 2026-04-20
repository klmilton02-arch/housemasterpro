import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  addMonths, subMonths, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks,
  addDays, subDays
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getStatusInfo } from "./TaskCard";

const VIEWS = ["Month", "Week", "Day"];

function TaskChip({ task, onViewDetails }) {
  const status = getStatusInfo(task);
  const isCompleted = task.status === "Completed";
  const isOverdue = status.label === "Overdue" || status.label === "Past Due";
  const colorClass = isCompleted
    ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
    : isOverdue
    ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
    : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400";
  const dotColor = isCompleted ? "bg-green-400" : isOverdue ? "bg-red-400" : "bg-blue-400";

  return (
    <button onClick={() => onViewDetails?.(task)} className="w-full text-left">
      <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-medium truncate ${colorClass}`}>
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="truncate">{task.name}</span>
      </div>
    </button>
  );
}

function getTasksForDay(tasks, date) {
  return tasks.filter(t => t.next_due_date && isSameDay(parseISO(t.next_due_date), date));
}

export default function TaskCalendar({ tasks, onViewDetails }) {
  const [calView, setCalView] = useState("Month");
  const [current, setCurrent] = useState(new Date());
  const today = new Date();

  // Navigation
  function prev() {
    if (calView === "Month") setCurrent(subMonths(current, 1));
    else if (calView === "Week") setCurrent(subWeeks(current, 1));
    else setCurrent(subDays(current, 1));
  }
  function next() {
    if (calView === "Month") setCurrent(addMonths(current, 1));
    else if (calView === "Week") setCurrent(addWeeks(current, 1));
    else setCurrent(addDays(current, 1));
  }

  // Title
  function getTitle() {
    if (calView === "Month") return format(current, "MMMM yyyy");
    if (calView === "Week") {
      const ws = startOfWeek(current);
      const we = endOfWeek(current);
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    return format(current, "EEEE, MMMM d, yyyy");
  }

  // Month view
  function MonthView() {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = monthStart.getDay();
    const paddedDays = [...Array(startPad).fill(null), ...days];

    return (
      <>
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} className="min-h-[60px] border-b border-r border-border/50" />;
            const dayTasks = getTasksForDay(tasks, day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, current);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[60px] border-b border-r border-border/50 p-1 ${(i + 1) % 7 === 0 ? "border-r-0" : ""} ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map(task => (
                    <TaskChip key={task.id} task={task} onViewDetails={onViewDetails} />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // Week view
  function WeekView() {
    const ws = startOfWeek(current);
    const days = eachDayOfInterval({ start: ws, end: endOfWeek(current) });
    return (
      <>
        <div className="grid grid-cols-7 border-b border-border">
          {days.map(day => (
            <div key={day.toISOString()} className={`text-center py-2 ${isSameDay(day, today) ? "text-primary font-bold" : "text-muted-foreground"}`}>
              <div className="text-[10px] font-semibold">{format(day, "EEE")}</div>
              <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isSameDay(day, today) ? "bg-primary text-primary-foreground" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(tasks, day);
            return (
              <div key={day.toISOString()} className={`min-h-[120px] border-r border-border/50 p-1.5 space-y-1 ${i === 6 ? "border-r-0" : ""}`}>
                {dayTasks.length === 0 && (
                  <div className="text-[9px] text-muted-foreground mt-2 text-center">—</div>
                )}
                {dayTasks.map(task => (
                  <TaskChip key={task.id} task={task} onViewDetails={onViewDetails} />
                ))}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // Day view
  function DayView() {
    const dayTasks = getTasksForDay(tasks, current);
    const isToday = isSameDay(current, today);
    return (
      <div className="p-4">
        <div className={`text-sm font-semibold mb-3 ${isToday ? "text-primary" : "text-foreground"}`}>
          {isToday ? "Today" : format(current, "EEEE, MMMM d")}
        </div>
        {dayTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No tasks due this day.</div>
        ) : (
          <div className="space-y-2">
            {dayTasks.map(task => {
              const status = getStatusInfo(task);
              const isCompleted = task.status === "Completed";
              const isOverdue = status.label === "Overdue" || status.label === "Past Due";
              const colorClass = isCompleted
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                : isOverdue
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400";
              return (
                <button
                  key={task.id}
                  onClick={() => onViewDetails?.(task)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium ${colorClass} hover:opacity-80 transition-opacity`}
                >
                  <div className="font-semibold">{task.name}</div>
                  {task.assigned_to_name && (
                    <div className="text-xs opacity-70 mt-0.5">{task.assigned_to_name}</div>
                  )}
                  <div className="text-xs opacity-70 mt-0.5">{status.label}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* View toggle */}
      <div className="flex border-b border-border">
        {VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setCalView(v)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${calView === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={prev} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-heading font-semibold text-sm text-center">{getTitle()}</h2>
        <button onClick={next} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {calView === "Month" && <MonthView />}
      {calView === "Week" && <WeekView />}
      {calView === "Day" && <DayView />}
    </div>
  );
}