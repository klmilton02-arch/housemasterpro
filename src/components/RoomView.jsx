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

const ROOM_COLOR = "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700";

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
              className={`border rounded-lg h-11 w-full flex items-center justify-between hover:shadow-md transition-all px-3 ${ROOM_COLOR}`}
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