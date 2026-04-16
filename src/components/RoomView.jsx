import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import TaskCard, { getStatusInfo } from "./TaskCard";

const ROOMS = [
  "Kitchen",
  "Bathroom",
  "Half Bath",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bedroom 4",
  "Living Room",
  "Dining Room",
  "Garage",
  "Laundry Room",
  "Mixed Use Room",
];

const ROOM_ICONS = {
  "Kitchen": "🍳",
  "Bathroom": "🚿",
  "Half Bath": "🪥",
  "Bedroom 1": "🛏️",
  "Bedroom 2": "🛏️",
  "Bedroom 3": "🛏️",
  "Bedroom 4": "🛏️",
  "Living Room": "🛋️",
  "Dining Room": "🍽️",
  "Garage": "🚗",
  "Laundry Room": "🧺",
  "Mixed Use Room": "📦",
};

function getRoomStatus(tasks) {
  const pending = tasks.filter(t => t.status !== "Completed");
  const hasOverdue = pending.some(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due";
  });
  const hasDueSoon = pending.some(t => getStatusInfo(t).label === "Due Soon");
  const allDone = pending.length === 0;
  return { pending: pending.length, hasOverdue, hasDueSoon, allDone };
}

export default function RoomView({ tasks, onComplete, onViewDetails, onDelete }) {
  const [expandedRooms, setExpandedRooms] = useState(new Set());

  const roomTasks = ROOMS.reduce((acc, room) => {
    acc[room] = tasks.filter(t => t.room === room);
    return acc;
  }, {});

  // Also collect tasks with no room
  const unassigned = tasks.filter(t => !t.room || !ROOMS.includes(t.room));

  const roomsWithTasks = ROOMS.filter(room => roomTasks[room].length > 0);

  function toggleRoom(room) {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      next.has(room) ? next.delete(room) : next.add(room);
      return next;
    });
  }

  function renderRoom(room, roomTaskList) {
    const isExpanded = expandedRooms.has(room);
    const { pending, hasOverdue, hasDueSoon, allDone } = getRoomStatus(roomTaskList);

    let borderColor = "border-border";
    let bgColor = "bg-card";
    let badgeBg = "bg-muted text-muted-foreground";
    let StatusIcon = null;

    if (allDone) {
      borderColor = "border-green-300 dark:border-green-700";
      bgColor = "bg-green-50/60 dark:bg-green-950/20";
      badgeBg = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      StatusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
    } else if (hasOverdue) {
      borderColor = "border-red-300 dark:border-red-700";
      bgColor = "bg-red-50/40 dark:bg-red-950/10";
      badgeBg = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      StatusIcon = <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    } else if (hasDueSoon) {
      borderColor = "border-amber-300 dark:border-amber-700";
      bgColor = "bg-amber-50/40 dark:bg-amber-950/10";
      badgeBg = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
      StatusIcon = <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }

    const pendingTasks = roomTaskList.filter(t => t.status !== "Completed");
    const completedTasks = roomTaskList.filter(t => t.status === "Completed");
    // Sort: pending first (by due date), then completed
    const sortedTasks = [
      ...pendingTasks.sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)),
      ...completedTasks,
    ];

    return (
      <div key={room}>
        <button
          onClick={() => toggleRoom(room)}
          className={`border rounded-lg w-full flex items-center justify-between hover:shadow-md transition-all px-3 py-2.5 ${borderColor} ${bgColor}`}
        >
          <div className="flex items-center gap-2.5 flex-1 text-left">
            <span className="text-base">{ROOM_ICONS[room] || "🏠"}</span>
            <span className="font-heading font-semibold text-sm">{room}</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${badgeBg}`}>
              {StatusIcon}
              {allDone ? "All done" : `${pending} pending`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{roomTaskList.length} total</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>
        {isExpanded && (
          <div className="mt-2 ml-2 pl-3 border-l-2 border-muted space-y-2">
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roomsWithTasks.length === 0 && unassigned.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-xs text-muted-foreground">No tasks assigned to rooms.</p>
        </div>
      )}

      {roomsWithTasks.map(room => renderRoom(room, roomTasks[room]))}

      {unassigned.length > 0 && renderRoom("Unassigned", unassigned)}
    </div>
  );
}