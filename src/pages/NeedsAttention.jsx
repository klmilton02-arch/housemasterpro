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
    const updated = {
      ...task,
      status: "Completed",
      last_completed_date: today.toISOString().split("T")[0],
      next_due_date: nextDue.toISOString().split("T")[0],
    };

    // Mark as just-completed so TaskCard turns green immediately
    setJustCompletedIds(prev => new Set([...prev, task.id]));
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    // After a pause, remove from urgent list by reloading
    setTimeout(() => {
      setJustCompletedIds(prev => { const n = new Set(prev); n.delete(task.id); return n; });
      loadTasks();
    }, 1500);

    base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: updated.last_completed_date,
      next_due_date: updated.next_due_date,
    });
    const result = await awardPoints(task, blastActive);
    if (result) setReward(result);
  }

  const urgentTasks = tasks.filter(t => {
    const s = getStatusInfo(t);
    return s.label === "Overdue" || s.label === "Past Due" || s.label === "Due Soon";
  }).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

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