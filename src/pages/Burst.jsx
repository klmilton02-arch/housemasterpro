import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Zap } from "lucide-react";
import BurstTimer from "@/components/BurstTimer";
import TaskCard from "@/components/TaskCard";
import PointsToast from "@/components/PointsToast";
import BlastModeToast from "@/components/BlastModeToast";
import { awardPoints } from "@/utils/gamification";
import confetti from "canvas-confetti";

export default function Burst() {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(30); // minutes
  const [timeLeft, setTimeLeft] = useState(30 * 60); // seconds
  const [completions, setCompletions] = useState({});
  const [reward, setReward] = useState(null);
  const [blastToastShow, setBlastToastShow] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-next_due_date"),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["family-members"],
    queryFn: () => base44.entities.FamilyMember.list(),
  });

  const { data: gamification = [] } = useQuery({
    queryKey: ["gamification"],
    queryFn: () => base44.entities.GamificationProfile.list(),
  });

  const completionMutation = useMutation({
    mutationFn: async ({ task, memberId }) => {
      const today = new Date().toISOString().split("T")[0];
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + task.frequency_days);
      
      await base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: today,
        next_due_date: nextDue.toISOString().split("T")[0],
      });

      const result = await awardPoints(task);
      if (result) {
        setReward(result);
        if (result.blastBonus) {
          setBlastToastShow(true);
          setTimeout(() => setBlastToastShow(false), 2000);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsActive(false);
          endBurst();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  function startBurst() {
    setTimeLeft(duration * 60);
    setCompletions({});
    setIsActive(true);
    localStorage.setItem("blast_mode_active", "true");
  }

  function endBurst() {
    localStorage.removeItem("blast_mode_active");
    if (Object.keys(completions).length > 0) {
      confetti({ particleCount: 100, spread: 70 });
    }
  }

  function handleTaskComplete(task) {
    const key = `${task.id}-${task.assigned_to}`;
    if (!completions[key]) {
      setCompletions(prev => ({ ...prev, [key]: true }));
      completionMutation.mutate({
        task,
        memberId: task.assigned_to,
      });
    }
  }

  const pendingTasks = tasks.filter(t => t.status === "Pending" || t.status === "Overdue");
  const progress = 100 - (timeLeft / (duration * 60)) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-black rounded-xl h-11 text-base font-bold mb-6">
          <Zap className="w-5 h-5" /> Blast Mode
        </div>

        {!isActive ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center mb-6">
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
            <Button onClick={startBurst} size="lg" className="gap-2 bg-yellow-400 hover:bg-yellow-500 text-black">
              <Play className="w-4 h-4" /> Start Blast
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <BurstTimer timeLeft={timeLeft} duration={duration} />
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setIsActive(!isActive)} variant="outline" className="gap-2">
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isActive ? "Pause" : "Resume"}
              </Button>
              <Button onClick={() => { setIsActive(false); localStorage.removeItem("blast_mode_active"); endBurst(); }} variant="outline" className="gap-2 text-destructive">
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
                <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
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
                  <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
                ))}
              </div>
            )}
          </div>
        )}

      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
      <BlastModeToast show={blastToastShow} onDismiss={() => setBlastToastShow(false)} />
      </div>
    </div>
  );
}