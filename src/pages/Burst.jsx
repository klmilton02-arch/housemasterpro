import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Zap } from "lucide-react";
import BurstTimer from "@/components/BurstTimer";
import confetti from "canvas-confetti";

export default function Burst() {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(30); // minutes
  const [timeLeft, setTimeLeft] = useState(30 * 60); // seconds
  const [completions, setCompletions] = useState({});

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
    mutationFn: async ({ taskId, memberId, xpBonus }) => {
      const task = tasks.find(t => t.id === taskId);
      const today = new Date().toISOString().split("T")[0];
      
      await base44.entities.Task.update(taskId, {
        status: "Completed",
        last_completed_date: today,
      });

      await base44.entities.CompletionHistory.create({
        family_member_id: memberId,
        family_member_name: members.find(m => m.id === memberId)?.name || "Unknown",
        task_id: taskId,
        task_name: task?.name || "Unknown Task",
        points_earned: xpBonus,
        completed_date: today,
        is_overdue: false,
      });

      const profile = gamification.find(g => g.family_member_id === memberId);
      if (profile) {
        await base44.entities.GamificationProfile.update(profile.id, {
          total_xp: (profile.total_xp || 0) + xpBonus,
          total_completions: (profile.total_completions || 0) + 1,
        });
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
  }

  function endBurst() {
    if (Object.keys(completions).length > 0) {
      confetti({ particleCount: 100, spread: 70 });
    }
  }

  function handleTaskComplete(taskId, memberId) {
    const key = `${taskId}-${memberId}`;
    if (!completions[key]) {
      setCompletions(prev => ({ ...prev, [key]: true }));
      completionMutation.mutate({
        taskId,
        memberId,
        xpBonus: 50, // Blast bonus XP
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
              <Button onClick={() => { setIsActive(false); endBurst(); }} variant="outline" className="gap-2 text-destructive">
                <X className="w-4 h-4" /> End Blast
              </Button>
            </div>
          </div>
        )}

        {isActive && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">Complete tasks to earn bonus XP!</h2>
            {pendingTasks.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                No pending tasks. Great job staying on top of things!
              </div>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{task.name}</h3>
                    <p className="text-xs text-muted-foreground">Assigned to: {task.assigned_to_name || "Unassigned"}</p>
                  </div>
                  <Button
                    onClick={() => handleTaskComplete(task.id, task.assigned_to)}
                    disabled={!task.assigned_to || completions[`${task.id}-${task.assigned_to}`]}
                    size="sm"
                  >
                    {completions[`${task.id}-${task.assigned_to}`] ? "✓ Done" : "Mark Done"}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {!isActive && Object.keys(completions).length > 0 && (
          <div className="bg-primary/10 border border-primary rounded-2xl p-6 text-center">
            <p className="font-heading text-xl font-bold text-primary mb-2">Blast Complete!</p>
            <p className="text-muted-foreground">{Object.keys(completions).length} task{Object.keys(completions).length !== 1 ? 's' : ''} completed. Extra XP awarded!</p>
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
                  <div key={task.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.name}</h3>
                      <p className="text-xs text-muted-foreground">Assigned to: {task.assigned_to_name || "Unassigned"}</p>
                    </div>
                    <Button
                      onClick={() => handleTaskComplete(task.id, task.assigned_to)}
                      disabled={!task.assigned_to}
                      size="sm"
                      variant="outline"
                    >
                      Mark Done
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}