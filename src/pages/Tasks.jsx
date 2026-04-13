import { useState, useEffect, useCallback } from "react";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2 } from "lucide-react";
import { awardPoints } from "@/utils/gamification";
import PointsToast from "../components/PointsToast";
import { Button } from "@/components/ui/button";
import MobileSelect from "../components/MobileSelect";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reward, setReward] = useState(null);

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  usePullToRefresh(loadTasks);

  async function handleComplete(task) {
    if (task.status === "Pending") {
      const today = new Date();
      const nextDue = new Date(today);
      nextDue.setDate(nextDue.getDate() + task.frequency_days);
      const updated = {
        ...task,
        status: "Completed",
        last_completed_date: today.toISOString().split("T")[0],
        next_due_date: nextDue.toISOString().split("T")[0],
      };
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      await base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: updated.last_completed_date,
        next_due_date: updated.next_due_date,
      });
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

  const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];

  const filtered = tasks.filter(t => {
    const status = getStatusInfo(t);
    if (statusFilter === "overdue" && status.label !== "Overdue" && status.label !== "Past Due") return false;
    if (statusFilter === "due_soon" && status.label !== "Due Soon") return false;
    if (statusFilter === "completed" && status.label !== "Completed") return false;
    if (statusFilter === "pending" && status.label === "Completed") return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  }).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-xs mx-auto px-1 pt-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">All Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} tasks</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1 w-full text-xs">
          <Plus className="w-3 h-3" /> Add Task
        </Button>
      </div>

      <div className="flex gap-1 w-full flex-col">
        <MobileSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          title="Filter by Status"
          triggerClassName="flex-1 min-w-0 text-xs h-8"
          options={[
            { value: "all", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "overdue", label: "Overdue" },
            { value: "due_soon", label: "Due Soon" },
            { value: "completed", label: "Completed" },
          ]}
        />
        <MobileSelect
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          title="Filter by Category"
          triggerClassName="flex-1 min-w-0 text-xs"
          options={[
            { value: "all", label: "All Categories" },
            ...categories.map(c => ({ value: c, label: c })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-xs text-muted-foreground">No tasks match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className="relative group w-full">
              <TaskCard task={task} onComplete={handleComplete} className="w-full"/>
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
                    <AlertDialogAction onClick={() => handleDelete(task)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
    </div>
  );
}