import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleComplete(task) {
    const today = new Date();
    const nextDue = new Date(today);
    nextDue.setDate(nextDue.getDate() + task.frequency_days);
    const updated = {
      ...task,
      status: "Completed",
      last_completed_date: today.toISOString().split("T")[0],
      next_due_date: nextDue.toISOString().split("T")[0],
    };
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: updated.last_completed_date,
      next_due_date: updated.next_due_date,
    });
    loadTasks();
  }

  async function handleDelete(task) {
    // Optimistic update
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">All Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} tasks</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><Filter className="w-3 h-3 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No tasks match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(task => (
            <div key={task.id} className="relative group">
              <TaskCard task={task} onComplete={handleComplete} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}