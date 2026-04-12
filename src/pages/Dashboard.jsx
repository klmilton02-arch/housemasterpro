import { useState, useEffect, useCallback } from "react";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { ListChecks, AlertTriangle, Clock, CheckCircle, Plus, X } from "lucide-react";
import CompletedTaskItem from "../components/CompletedTaskItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { awardPoints } from "@/utils/gamification";
import PointsToast from "../components/PointsToast";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO } from "date-fns";
import StatCard from "../components/StatCard";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reward, setReward] = useState(null);
  const [taskListModal, setTaskListModal] = useState(null); // { title, tasks }

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  usePullToRefresh(loadTasks);

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
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: updated.last_completed_date,
      next_due_date: updated.next_due_date,
    });
    const result = await awardPoints(task);
    if (result) setReward(result);
    loadTasks();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due";
  });
  const dueSoonTasks = tasks.filter(t => getStatusInfo(t).label === "Due Soon");
  const completedTasks = tasks.filter(t => getStatusInfo(t).label === "Completed");
  const urgentTasks = [...overdueTasks, ...dueSoonTasks].sort((a, b) =>
    new Date(a.next_due_date) - new Date(b.next_due_date)
  ).slice(0, 8);

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
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your household at a glance</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ListChecks} label="Total Tasks" value={tasks.length} color="bg-blue-100 text-blue-600" onClick={() => setTaskListModal({ title: 'All Tasks', tasks })} />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks.length} color="bg-red-100 text-red-600" />
        <StatCard icon={Clock} label="Due Soon" value={dueSoonTasks.length} color="bg-amber-100 text-amber-600" />
        <StatCard icon={CheckCircle} label="Completed" value={completedTasks.length} color="bg-green-100 text-green-600" onClick={() => setTaskListModal({ title: 'Completed Tasks', tasks: completedTasks })} />
      </div>

      <div>
        <h2 className="font-heading font-semibold text-lg mb-3">Needs Attention</h2>
        {urgentTasks.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All caught up! No urgent tasks.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {urgentTasks.map(task => (
              <TaskCard key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </div>
        )}
      </div>

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />

      <Dialog open={!!taskListModal} onOpenChange={() => setTaskListModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto !top-8 !translate-y-0">
          <DialogHeader>
            <DialogTitle className="font-heading">{taskListModal?.title} ({taskListModal?.tasks?.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {taskListModal?.tasks?.map(task => (
              taskListModal.title === 'Completed Tasks'
                ? <CompletedTaskItem key={task.id} task={task} />
                : <TaskCard key={task.id} task={task} onComplete={handleComplete} />
            ))}
            {taskListModal?.tasks?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No tasks here.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}