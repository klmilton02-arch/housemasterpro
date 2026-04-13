import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Car, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";
import { awardPoints } from "@/utils/gamification";
import PointsToast from "../components/PointsToast";
import usePullToRefresh from "@/hooks/usePullToRefresh";

export default function CarMaintenance() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reward, setReward] = useState(null);

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.filter({ category: "Car Maintenance" }, "-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  usePullToRefresh(loadTasks);

  async function handleComplete(task) {
    if (task.status === "Pending") {
      const today = new Date();
      const nextDue = new Date(today);
      nextDue.setDate(nextDue.getDate() + (task.frequency_days || 365));
      const updated = {
        status: "Completed",
        last_completed_date: today.toISOString().split("T")[0],
        next_due_date: nextDue.toISOString().split("T")[0],
      };
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updated } : t));
      await base44.entities.Task.update(task.id, updated);
      const result = await awardPoints(task);
      if (result) setReward(result);
      loadTasks();
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      await base44.entities.Task.update(task.id, { status: task.status });
      loadTasks();
    }
  }

  async function handleDelete(task) {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    await base44.entities.Task.delete(task.id);
  }

  const overdue = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due";
  });
  const upcoming = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Due Soon" || s.label === "Upcoming";
  });
  const completed = tasks.filter(t => getStatusInfo(t).label === "Completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xs mx-auto px-1">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold">Car Maintenance</h1>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-red-500">{overdue.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-amber-500">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-500">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1 w-full text-xs">
          <Plus className="w-3 h-3" /> Add Car Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Gauge className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No car maintenance tasks yet.</p>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Overdue</h2>
              <div className="space-y-2">
                {overdue.sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)).map(task => (
                  <TaskCardRow key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)).map(task => (
                  <TaskCardRow key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Completed</h2>
              <div className="space-y-2">
                {completed.map(task => (
                  <TaskCardRow key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
    </div>
  );
}

function TaskCardRow({ task, onComplete, onDelete }) {
  return (
    <div className="relative group w-full">
      <TaskCard task={task} onComplete={onComplete} onRenamed={() => {}} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="absolute top-10 right-2 p-1 rounded-lg bg-card/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-muted-foreground hover:text-red-500">
            <Trash2 className="w-3 h-3" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{task.name}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(task)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}