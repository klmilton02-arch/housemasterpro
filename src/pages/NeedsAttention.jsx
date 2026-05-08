import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle } from "lucide-react";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import PointsToast from "../components/PointsToast";
import { awardPoints } from "@/utils/gamification";
import confetti from "canvas-confetti";
import { useBlastMode } from "@/lib/BlastModeContext";

export default function NeedsAttention() {
  const { isActive: blastActive } = useBlastMode();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reward, setReward] = useState(null);
  const [justCompletedIds, setJustCompletedIds] = useState(new Set());

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
    const todayStr = today.toISOString().split("T")[0];
    const nextDueStr = nextDue.toISOString().split("T")[0];

    // Immediately turn green in place
    setJustCompletedIds(prev => new Set([...prev, task.id]));
    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, status: "Completed", last_completed_date: todayStr, next_due_date: nextDueStr }
      : t
    ));

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    // Fire DB write in background
    base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: todayStr,
      next_due_date: nextDueStr,
    });

    // After pause, remove from list (no reload — avoids race condition)
    setTimeout(() => {
      setJustCompletedIds(prev => { const n = new Set(prev); n.delete(task.id); return n; });
      setTasks(prev => prev.filter(t => t.id !== task.id));
    }, 1800);

    const result = await awardPoints(task, blastActive);
    if (result) setReward(result);
  }

  const urgentTasks = tasks.filter(t => {
    if (justCompletedIds.has(t.id)) return true; // keep pinned during animation
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due" || s.label === "Due Soon";
  }).sort((a, b) => {
    // Push just-completed to bottom
    const aComp = justCompletedIds.has(a.id);
    const bComp = justCompletedIds.has(b.id);
    if (aComp !== bComp) return aComp ? 1 : -1;
    return new Date(a.next_due_date) - new Date(b.next_due_date);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Needs Attention</h1>
        <p className="text-sm text-muted-foreground mt-1">Urgent and upcoming tasks</p>
      </div>

      {urgentTasks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All caught up! No urgent tasks.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {urgentTasks.map(task => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} isInJustCompleted={justCompletedIds.has(task.id)} />
          ))}
        </div>
      )}

      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
    </div>
  );
}