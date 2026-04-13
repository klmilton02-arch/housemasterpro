import { useState, useEffect, useCallback } from "react";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { ListChecks, AlertTriangle, Clock, CheckCircle, Plus } from "lucide-react";
import CompletedTaskItem from "../components/CompletedTaskItem";
import QuickNav from "../components/QuickNav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { awardPoints } from "@/utils/gamification";
import PointsToast from "../components/PointsToast";
import { Button } from "@/components/ui/button";
import StatCard from "../components/StatCard";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";
import LeaderboardSummary from "../components/LeaderboardSummary";
import SyncCalendarButton from "../components/SyncCalendarButton";
import TaskDetailModal from "../components/TaskDetailModal";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reward, setReward] = useState(null);
  const [taskListModal, setTaskListModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  usePullToRefresh(loadTasks);

  async function handleComplete(task) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const nextDue = new Date(today);
    nextDue.setDate(nextDue.getDate() + task.frequency_days);

    // Streak: increment if daily task completed within 2-day window, else reset to 1
    let newStreak = 1;
    if (task.frequency_days <= 1 && task.last_completed_date) {
      const { differenceInDays, parseISO } = await import("date-fns");
      const daysSinceLast = differenceInDays(today, parseISO(task.last_completed_date));
      newStreak = daysSinceLast <= 2 ? (task.streak || 0) + 1 : 1;
    }

    const updated = {
      ...task,
      status: "Completed",
      last_completed_date: todayStr,
      next_due_date: nextDue.toISOString().split("T")[0],
      streak: newStreak,
    };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: updated.last_completed_date,
      next_due_date: updated.next_due_date,
      streak: newStreak,
    });
    const result = await awardPoints(task);
    if (result) setReward(result);
    loadTasks();
  }

  const overdueTasks = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due";
  });
  const dueSoonTasks = tasks.filter(t => getStatusInfo(t).label === "Due Soon");
  const completedTasks = tasks.filter(t => getStatusInfo(t).label === "Completed");
  const dueTasks = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due" || s.label === "Due Soon" || s.label === "Upcoming";
  });
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
    <div className="space-y-6 max-w-xs md:max-w-2xl mx-auto px-2 sm:px-1 pt-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading text-3xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-base sm:text-sm text-muted-foreground mt-1">Your home maintenance at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDialogOpen(true)} className="gap-2 flex-1">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
          <SyncCalendarButton />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3">
        <StatCard icon={ListChecks} label="Due" value={dueTasks.length} color="bg-blue-100 text-blue-600" onClick={() => setTaskListModal({ title: 'Due Tasks', tasks: dueTasks })} />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks.length} color="bg-red-100 text-red-600" onClick={() => setTaskListModal({ title: 'Overdue Tasks', tasks: overdueTasks })} />
        <StatCard icon={Clock} label="Due Soon" value={dueSoonTasks.length} color="bg-amber-100 text-amber-600" onClick={() => setTaskListModal({ title: 'Due Soon', tasks: dueSoonTasks })} />
        <StatCard icon={CheckCircle} label="Completed" value={completedTasks.length} color="bg-green-100 text-green-600" onClick={() => setTaskListModal({ title: 'Completed Tasks', tasks: completedTasks })} />
      </div>

      <LeaderboardSummary />

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-foreground">All Tasks</h2>
          <span className="text-sm text-muted-foreground">{tasks.length} total</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.slice(0, 10).map(task => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} onViewDetails={setSelectedTask} />
          ))}
          {tasks.length > 10 && (
            <p className="text-center text-xs text-muted-foreground py-2">+{tasks.length - 10} more tasks</p>
          )}
        </div>
      </div>

      <QuickNav />

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
      <TaskDetailModal task={selectedTask} open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }} />

      <Drawer open={!!taskListModal} onOpenChange={() => setTaskListModal(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="font-heading">{taskListModal?.title} ({taskListModal?.tasks?.length})</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-6 overflow-y-auto max-w-xs mx-auto w-full">
            {taskListModal?.tasks?.map(task => (
              taskListModal.title === 'Completed Tasks'
                ? <CompletedTaskItem key={task.id} task={task} />
                : <TaskCard key={task.id} task={task} onComplete={handleComplete} onViewDetails={setSelectedTask} />
            ))}
            {taskListModal?.tasks?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No tasks here.</p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}