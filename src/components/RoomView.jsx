import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import TaskCard from "./TaskCard";

const ROOMS = [
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Living Room",
  "Dining Room",
  "Garage",
  "Laundry Room",
  "Office",
  "Basement",
  "Attic",
  "Outdoor",
  "Whole House"
];

const ROOM_COLORS = {
  Kitchen: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  Bathroom: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  Bedroom: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  "Living Room": "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  "Dining Room": "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  Garage: "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800",
  "Laundry Room": "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800",
  Office: "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800",
  Basement: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800",
  Attic: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800",
  Outdoor: "bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-800",
  "Whole House": "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800"
};

export default function RoomView({ tasks, onComplete, onViewDetails, onDelete }) {
  const [expandedRoom, setExpandedRoom] = useState(null);

  const roomTasks = ROOMS.reduce((acc, room) => {
    acc[room] = tasks.filter(t => t.room === room);
    return acc;
  }, {});

  const roomsWithTasks = ROOMS.filter(room => roomTasks[room].length > 0);

  return (
    <div className="space-y-3">
      {roomsWithTasks.map(room => {
        const tasks = roomTasks[room];
        const isExpanded = expandedRoom === room;
        return (
          <div key={room}>
            <button
              onClick={() => setExpandedRoom(isExpanded ? null : room)}
              className={`border rounded-lg p-3 w-full flex items-center justify-between hover:shadow-md transition-all ${ROOM_COLORS[room]}`}
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <span className="font-heading font-semibold text-sm">{room}</span>
                <span className="text-xs font-medium text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
              </div>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isExpanded && (
              <div className="mt-2 ml-2 pl-3 border-l-2 border-muted space-y-2">
                {tasks.map(task => (
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
      })}
      {roomsWithTasks.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-xs text-muted-foreground">No tasks assigned to rooms.</p>
        </div>
      )}
    </div>
  );
}