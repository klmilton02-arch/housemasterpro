import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { ListChecks, AlertTriangle, Clock, CheckCircle, Plus, ChevronDown, ChevronUp, Zap, Flame, CalendarDays } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import CompletedTaskItem from "../components/CompletedTaskItem";
import QuickNav from "../components/QuickNav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { awardPoints, revokePoints, getTaskPoints } from "@/utils/gamification";
import PointsToast from "../components/PointsToast";
import BlastModeToast from "../components/BlastModeToast";
import { Button } from "@/components/ui/button";
import StatCard from "../components/StatCard";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";
import SyncCalendarButton from "../components/SyncCalendarButton";
import LeaderboardSummary from "../components/LeaderboardSummary";
import TaskDetailModal from "../components/TaskDetailModal";
import EditTaskDialog from "../components/EditTaskDialog";
import BadgeDisplay from "../components/BadgeDisplay";
import { getEarnedBadges } from "@/utils/badges";
import { useBlastMode } from "@/lib/BlastModeContext";
import DashboardPresetBrowser from "../components/DashboardPresetBrowser";
import RevokePointsToast from "../components/RevokePointsToast";
import BlastModeOptionsDialog from "../components/BlastModeOptionsDialog";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isActive: isBlastActive, startBlast, stopBlast, timeLeft } = useBlastMode();

  const blastDisplay = isBlastActive
    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
    : "Start";
  // Swipe navigation disabled — conflicts with vertical scrolling
  const handleTouchStart = () => {};
  const handleTouchEnd = () => {};
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reward, setReward] = useState(null);
  const [blastToastShow, setBlastToastShow] = useState(false);
  const [taskListModal, setTaskListModal] = useState(null);
  const [allTasksOpen, setAllTasksOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [profile, setProfile] = useState(null);
  const [revokedPoints, setRevokedPoints] = useState(null);
  const [blastOptionsOpen, setBlastOptionsOpen] = useState(false);
  const [justCompletedIds, setJustCompletedIds] = useState(new Set());
  const [drawerTaskIds, setDrawerTaskIds] = useState(null); // ordered list of task ids for the drawer

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      if (me) {
        const profiles = await base44.entities.GamificationProfile.filter({
          family_member_name: me.full_name
        });
        if (profiles.length > 0) {
          setProfile(profiles[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }, []);

  useEffect(() => { loadTasks(); loadProfile(); }, [loadTasks, loadProfile]);

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

    // Mark as just-completed immediately so TaskCard turns green and stays in place
    setJustCompletedIds(prev => new Set([...prev, task.id]));

    // Move completed task to bottom of drawer list after a short visual pause
    setTimeout(() => {
      setDrawerTaskIds(prev => {
        if (!prev) return prev;
        const without = prev.filter(id => id !== task.id);
        return [...without, task.id];
      });
    }, 800);

    // Fire confetti + XP toast right away
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    // Do DB write + gamification in background
    base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: todayStr,
      next_due_date: nextDue.toISOString().split("T")[0],
      streak: newStreak,
      completed_with_blast: isBlastActive,
    });
    awardPoints(task, isBlastActive).then(result => {
      if (result) {
        setReward(result);
        if (result.blastBonus) {
          setBlastToastShow(true);
          setTimeout(() => setBlastToastShow(false), 2000);
        }
      }
    });

    // After pause, reload tasks and clear just-completed
    setTimeout(() => {
      setJustCompletedIds(prev => { const n = new Set(prev); n.delete(task.id); return n; });
      loadTasks();
    }, 2000);
  }

  async function handleUncomplete(task) {
    // Revert task to Pending and undo the next_due_date advancement
    const prevDue = new Date(task.next_due_date);
    prevDue.setDate(prevDue.getDate() - task.frequency_days);
    const revertedDue = prevDue.toISOString().split("T")[0];

    const updated = { ...task, status: "Pending", next_due_date: revertedDue };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { status: "Pending", next_due_date: revertedDue, completed_with_blast: false });
    await revokePoints(task, task.completed_with_blast === true);
    setRevokedPoints(getTaskPoints(task) * (task.completed_with_blast ? 2 : 1));
    loadTasks();
  }

  async function handleChangeDueDate(task, newDate) {
    if (!newDate) return;
    await base44.entities.Task.update(task.id, { next_due_date: newDate });
    loadTasks();
  }

  const overdueTasks = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due";
  });
  const dueSoonTasks = tasks.filter(t => getStatusInfo(t).label === "Due Soon");
  const pendingTasks = tasks.filter(t => t.status !== "Completed");
  const completedTasks = tasks.filter(t => getStatusInfo(t).label === "Completed");
  const dueTasks = tasks.filter(t => {
    if (t.status === "Completed") return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = parseISO(t.next_due_date); due.setHours(0,0,0,0);
    return differenceInDays(due, today) === 0;
  });
  const urgentTasks = [...overdueTasks, ...dueSoonTasks].sort((a, b) =>
    new Date(a.next_due_date) - new Date(b.next_due_date)
  ).slice(0, 8);

  // Build live ordered task list for the drawer (looks up current task objects by id order)
  const taskById = Object.fromEntries(tasks.map(t => [t.id, t]));
  const drawerLiveTasks = drawerTaskIds
    ? drawerTaskIds.map(id => taskById[id]).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      <h1 className="font-heading text-3xl font-bold md:hidden">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={ListChecks} label="Due Today" value={dueTasks.length} color="bg-blue-100 text-blue-600" onClick={() => { setDrawerTaskIds(dueTasks.map(t => t.id)); setTaskListModal({ title: 'Due Today' }); }} />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks.length} color="bg-red-100 text-red-600" onClick={() => { setDrawerTaskIds(overdueTasks.map(t => t.id)); setTaskListModal({ title: 'Overdue Tasks' }); }} />
        <StatCard icon={Clock} label="Pending Tasks" value={pendingTasks.length} color="bg-amber-100 text-amber-600" onClick={() => { setDrawerTaskIds(pendingTasks.map(t => t.id)); setTaskListModal({ title: 'Pending Tasks' }); }} />
        <StatCard icon={CheckCircle} label="Completed" value={completedTasks.length} color="bg-green-100 text-green-600" onClick={() => { setDrawerTaskIds(completedTasks.map(t => t.id)); setTaskListModal({ title: 'Completed Tasks' }); }} />
        <div className="col-span-2">
          <StatCard icon={Flame} label="Blast Mode" value={blastDisplay} color={isBlastActive ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-600"} onClick={() => isBlastActive ? setBlastOptionsOpen(true) : startBlast(30)} />
        </div>
        <div className="col-span-2">
          <Link to="/calendar" className="block">
            <StatCard icon={CalendarDays} label="Calendar" value="View" color="bg-purple-100 text-purple-600" />
          </Link>
        </div>
      </div>

      <LeaderboardSummary />



      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-5 hover:bg-muted/40 transition-colors"
          onClick={() => setAllTasksOpen(o => !o)}
        >
          <h2 className="font-heading font-semibold text-lg text-foreground">All Tasks</h2>
          <div className="flex items-center gap-2">
            <span className="text-base text-muted-foreground">{tasks.length} total</span>
            {allTasksOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
        {allTasksOpen && (
          <div className="space-y-3 max-h-72 overflow-y-auto px-5 pb-5">
            {tasks.slice(0, 10).map(task => (
              <TaskCard key={task.id} task={task} onComplete={handleComplete} onViewDetails={setSelectedTask} />
            ))}
            {tasks.length > 10 && (
              <p className="text-center text-xs text-muted-foreground py-2">+{tasks.length - 10} more tasks</p>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <DashboardPresetBrowser onTaskAdded={loadTasks} />
      </div>



      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
      <RevokePointsToast points={revokedPoints} onDismiss={() => setRevokedPoints(null)} />
      <BlastModeOptionsDialog
        open={blastOptionsOpen}
        onOpenChange={setBlastOptionsOpen}
        timeLeft={timeLeft}
        onContinue={() => {}}
        onRestart={() => startBlast(30)}
        onStop={stopBlast}
      />
      <BlastModeToast show={blastToastShow} onDismiss={() => setBlastToastShow(false)} />
      <TaskDetailModal 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }} 
        onModify={(task) => {
          setSelectedTask(null);
          setEditingTask(task);
        }}
        onChangeDueDate={handleChangeDueDate} 
      />
      <EditTaskDialog task={editingTask} open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }} onTaskUpdated={loadTasks} />

      <Drawer open={!!taskListModal} onOpenChange={(open) => { if (!open) { setTaskListModal(null); setDrawerTaskIds(null); setJustCompletedIds(new Set()); } }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="font-heading">{taskListModal?.title} ({drawerLiveTasks.length})</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-6 overflow-y-auto max-w-xl mx-auto w-full text-sm [&_.font-heading]:text-sm [&_.text-base]:text-xs [&_h3]:text-sm">
            {drawerLiveTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={taskListModal?.title === 'Completed Tasks' ? handleUncomplete : handleComplete}
                onViewDetails={setSelectedTask}
                isInJustCompleted={justCompletedIds.has(task.id)}
              />
            ))}
            {drawerLiveTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No tasks here.</p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}