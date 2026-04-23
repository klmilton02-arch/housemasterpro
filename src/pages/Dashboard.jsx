import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { ListChecks, AlertTriangle, Clock, CheckCircle, Plus, ChevronDown, ChevronUp, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import CompletedTaskItem from "../components/CompletedTaskItem";
import QuickNav from "../components/QuickNav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { awardPoints } from "@/utils/gamification";
import PointsToast from "../components/PointsToast";
import BlastModeToast from "../components/BlastModeToast";
import { Button } from "@/components/ui/button";
import StatCard from "../components/StatCard";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";
import LeaderboardSummary from "../components/LeaderboardSummary";
import SyncCalendarButton from "../components/SyncCalendarButton";
import TaskDetailModal from "../components/TaskDetailModal";
import BadgeDisplay from "../components/BadgeDisplay";
import { getEarnedBadges } from "@/utils/badges";
import { useBlastMode } from "@/lib/BlastModeContext";
import DashboardPresetBrowser from "../components/DashboardPresetBrowser";

export default function Dashboard() {
  const { isActive: isBlastActive } = useBlastMode();
  const navigate = useNavigate();
  const touchStartX = useRef(null);

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff < -60) navigate("/profile");    // swipe right → profile
    else if (diff > 60) navigate("/tasks");  // swipe left → tasks
    touchStartX.current = null;
  }
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reward, setReward] = useState(null);
  const [blastToastShow, setBlastToastShow] = useState(false);
  const [taskListModal, setTaskListModal] = useState(null);
  const [allTasksOpen, setAllTasksOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [profile, setProfile] = useState(null);

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
    const result = await awardPoints(task, isBlastActive);
    if (result) {
      setReward(result);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      if (result.blastBonus) {
        setBlastToastShow(true);
        setTimeout(() => setBlastToastShow(false), 2000);
      }
    }
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
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      <h1 className="font-heading text-2xl font-bold md:hidden">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Button onClick={() => setDialogOpen(true)} className="gap-2 w-full text-lg h-11 bg-blue-400 hover:bg-blue-500 border-blue-400">
          <Plus className="w-5 h-5" /> Add Task
        </Button>
        <SyncCalendarButton className="w-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={ListChecks} label="Due" value={dueTasks.length} color="bg-blue-100 text-blue-600" onClick={() => setTaskListModal({ title: 'Due Tasks', tasks: dueTasks })} />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks.length} color="bg-red-100 text-red-600" onClick={() => setTaskListModal({ title: 'Overdue Tasks', tasks: overdueTasks })} />
        <StatCard icon={Clock} label="Due Soon" value={dueSoonTasks.length} color="bg-amber-100 text-amber-600" onClick={() => setTaskListModal({ title: 'Due Soon', tasks: dueSoonTasks })} />
        <StatCard icon={CheckCircle} label="Completed" value={completedTasks.length} color="bg-green-100 text-green-600" onClick={() => setTaskListModal({ title: 'Completed Tasks', tasks: completedTasks })} />
      </div>

      <LeaderboardSummary />

      <div className="pt-2">
      <Link to="/burst">
        <Button className="w-full gap-2 bg-yellow-200 hover:bg-yellow-300 text-black h-11 text-lg">
          <Zap className="w-5 h-5" /> Blast Mode
        </Button>
      </Link>
      </div>

      {profile && getEarnedBadges(profile).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-3">Your Badges</h2>
          <BadgeDisplay badges={getEarnedBadges(profile)} size="sm" />
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
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

      <DashboardPresetBrowser onTaskAdded={loadTasks} />

      <QuickNav />

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
      <BlastModeToast show={blastToastShow} onDismiss={() => setBlastToastShow(false)} />
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