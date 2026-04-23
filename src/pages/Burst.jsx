import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Zap } from "lucide-react";
import BurstTimer from "@/components/BurstTimer";
import TaskCard from "@/components/TaskCard";
import PointsToast from "@/components/PointsToast";
import TaskDetailModal from "@/components/TaskDetailModal";
import { awardPoints } from "@/utils/gamification";
import { useBlastMode } from "@/lib/BlastModeContext";
import confetti from "canvas-confetti";

export default function Burst() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const touchStartX = useRef(null);
  const { isActive, timeLeft, duration, setDuration, startBlast, stopBlast, pauseBlast, resumeBlast } = useBlastMode();

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff < -60) navigate("/leaderboard"); // swipe right → leaderboard
    else if (diff > 60) navigate("/tasks");    // swipe left → tasks
    touchStartX.current = null;
  }
  const [completions, setCompletions] = useState({});
  const [reward, setReward] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-next_due_date"),
  });

  const completionMutation = useMutation({
    mutationFn: async ({ task }) => {
      const today = new Date().toISOString().split("T")[0];
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + task.frequency_days);

      await base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: today,
        next_due_date: nextDue.toISOString().split("T")[0],
      });

      const result = await awardPoints(task, isActive);
      if (result) {
        setReward(result);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
    },
  });

  function handleStartBlast() {
    setCompletions({});
    startBlast(duration);
  }

  function handleStopBlast() {
    stopBlast();
    if (Object.keys(completions).length > 0) {
      confetti({ particleCount: 100, spread: 70 });
    }
  }

  function handleTaskComplete(task) {
    const key = `${task.id}-${task.assigned_to}`;
    if (!completions[key]) {
      setCompletions(prev => ({ ...prev, [key]: true }));
      completionMutation.mutate({ task });
    }
  }

  async function handleTaskCompleteNormal(task) {
    const today = new Date().toISOString().split("T")[0];
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + task.frequency_days);
    await base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: today,
      next_due_date: nextDue.toISOString().split("T")[0],
    });
    const result = await awardPoints(task, false);
    if (result) {
      setReward(result);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["gamification"] });
  }

  const pendingTasks = tasks.filter(t => t.status === "Pending" || t.status === "Overdue");

  return (
    <div className="min-h-screen bg-background" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ touchAction: 'pan-y' }}>
      <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7">
        <h1 className="font-heading text-2xl font-bold">Blast Mode</h1>

        <Button onClick={handleStartBlast} size="lg" className="gap-2 w-full h-11 bg-yellow-200 hover:bg-yellow-300 text-black font-semibold text-lg">
          <Play className="w-4 h-4" /> Start Blast
        </Button>

        {!isActive && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-6">Set your blast duration and race to complete the most tasks!</p>
            <div className="flex items-center gap-4 justify-center mb-6">
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium">Duration:</span>
                <input
                  type="number"
                  min="30"
                  max="60"
                  value={duration}
                  onChange={e => setDuration(Math.min(60, Math.max(30, parseInt(e.target.value) || 30)))}
                  className="w-20 h-9 px-3 rounded-md border border-input bg-transparent text-center"
                />
                <span className="text-sm">minutes</span>
              </label>
            </div>
          </div>
        )}

        {isActive && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <BurstTimer timeLeft={timeLeft} duration={duration} />
            <div className="flex gap-2 mt-4">
              <Button onClick={isActive ? pauseBlast : resumeBlast} variant="outline" className="gap-2">
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isActive ? "Pause" : "Resume"}
              </Button>
              <Button onClick={handleStopBlast} variant="outline" className="gap-2 text-destructive">
                <X className="w-4 h-4" /> End Blast
              </Button>
            </div>
          </div>
        )}

        {isActive && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Complete tasks to earn bonus XP!</h2>
            {pendingTasks.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                No pending tasks. Great job staying on top of things!
              </div>
            ) : (
              pendingTasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} onViewDetails={setSelectedTask} />
              ))
            )}
          </div>
        )}

        {!isActive && Object.keys(completions).length > 0 && (
          <div className="bg-yellow-400 border border-yellow-500 rounded-2xl p-6 text-center">
            <p className="font-heading text-xl font-bold text-black mb-2">⚡ Blast Mode Double XP</p>
            <p className="text-black/70">{Object.keys(completions).length} task{Object.keys(completions).length !== 1 ? 's' : ''} completed with 2× XP!</p>
          </div>
        )}

        {!isActive && (
          <div className="mt-8">
            <h2 className="font-heading text-lg font-semibold mb-4">Pending Tasks</h2>
            {pendingTasks.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                No pending tasks. Great job staying on top of things!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} onComplete={handleTaskCompleteNormal} onViewDetails={setSelectedTask} />
                ))}
              </div>
            )}
          </div>
        )}

        <PointsToast reward={reward} onDismiss={() => setReward(null)} />
        <TaskDetailModal task={selectedTask} open={!!selectedTask} onOpenChange={open => !open && setSelectedTask(null)} />
      </div>
    </div>

  );
}