import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import TaskCalendar from "../components/TaskCalendar";
import TaskDetailModal from "../components/TaskDetailModal";

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-2 pt-7 pb-7">
      <h1 className="font-heading text-3xl font-bold mb-6">Calendar</h1>
      <TaskCalendar tasks={tasks} onViewDetails={setSelectedTask} />
      <TaskDetailModal 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />
    </div>
  );
}