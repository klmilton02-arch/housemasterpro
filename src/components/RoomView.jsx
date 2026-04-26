import { useState, useRef } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Clock, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import TaskCard, { getStatusInfo } from "./TaskCard";

const ROOM_ORDER = [
  "Kitchen",
  "Bathroom", "Bathroom 1", "Bathroom 2", "Bathroom 3", "Bathroom 4", "Bathroom 5",
  "Half Bath", "Half Bath 1", "Half Bath 2", "Half Bath 3",
  "Bedroom", "Bedroom 1", "Bedroom 2", "Bedroom 3", "Bedroom 4", "Bedroom 5",
  "Living Room",
  "Dining Room",
  "Garage",
  "Laundry Room",
  "Mixed Use Room",
];

function getRoomIcon(room) {
  if (room.startsWith("Kitchen")) return "🍳";
  if (room.startsWith("Bathroom")) return "🚿";
  if (room.startsWith("Half Bath")) return "🪥";
  if (room.startsWith("Bedroom")) return "🛏️";
  if (room.startsWith("Living")) return "🛋️";
  if (room.startsWith("Dining")) return "🍽️";
  if (room.startsWith("Garage")) return "🚗";
  if (room.startsWith("Laundry")) return "🧺";
  return "📦";
}

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

export default function RoomView({ tasks, onComplete, onViewDetails, onDelete, onAddTask, onRoomRenamed }) {
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [renamingRoom, setRenamingRoom] = useState(null);
  const inputRef = useRef(null);

  // Build dynamic room list from actual task data, ordered by ROOM_ORDER
  const taskRooms = [...new Set(tasks.map(t => t.room).filter(Boolean))];
  const orderedRooms = [
    ...ROOM_ORDER.filter(r => taskRooms.includes(r)),
    ...taskRooms.filter(r => !ROOM_ORDER.includes(r)).sort(),
  ];

  const roomTasks = orderedRooms.reduce((acc, room) => {
    acc[room] = tasks.filter(t => t.room === room);
    return acc;
  }, {});

  const unassigned = tasks.filter(t => !t.room);
  const roomsWithTasks = orderedRooms.filter(room => roomTasks[room].length > 0);

  async function saveRoomName(oldRoom) {
    const newName = editingName.trim();
    if (!newName || newName === oldRoom) { setEditingRoom(null); return; }
    setRenamingRoom(oldRoom);
    setEditingRoom(null);
    // Bulk update all tasks in this room
    const roomTaskList = tasks.filter(t => t.room === oldRoom);
    await Promise.all(roomTaskList.map(t =>
      base44.entities.Task.update(t.id, {
        room: newName,
        name: t.name.startsWith(oldRoom + " –") ? t.name.replace(oldRoom + " –", newName + " –") : t.name,
      })
    ));
    setRenamingRoom(null);
    onRoomRenamed?.();
  }

  function startEdit(e, room) {
    e.stopPropagation();
    setEditingName(room);
    setEditingRoom(room);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

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

    const isRenaming = renamingRoom === room;

    return (
      <div key={room}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => !editingRoom && toggleRoom(room)}
            className={`border rounded-lg w-full flex items-center justify-between hover:shadow-md transition-all px-3 py-2.5 h-14 ${borderColor} ${bgColor}`}
          >
            <div className="flex items-center gap-2.5 flex-1 text-left">
              <span className="text-base">{getRoomIcon(room)}</span>
              {editingRoom === room ? (
                <input
                  ref={inputRef}
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => saveRoomName(room)}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveRoomName(room);
                    if (e.key === "Escape") setEditingRoom(null);
                    e.stopPropagation();
                  }}
                  onClick={e => e.stopPropagation()}
                  className="font-heading font-semibold text-sm border border-primary rounded px-1.5 py-0.5 outline-none bg-background w-32"
                />
              ) : (
                <span className="font-heading font-semibold text-sm">
                  {isRenaming ? <span className="text-muted-foreground italic">Saving…</span> : room}
                </span>
              )}
              {editingRoom !== room && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${badgeBg}`}>
                  {StatusIcon}
                  {allDone ? "All done" : `${pending} pending`}
                </span>
              )}
            </div>
            {editingRoom !== room && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{roomTaskList.length} total</span>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            )}
          </button>
          {room !== "Unassigned" && editingRoom !== room && (
            <Button
              size="icon"
              variant="ghost"
              onClick={e => startEdit(e, room)}
              className="shrink-0"
              title="Rename room"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {room !== "Unassigned" && editingRoom !== room && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onAddTask?.(room)}
              className="shrink-0"
              title="Add task to this room"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
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