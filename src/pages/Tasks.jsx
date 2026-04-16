import { useState, useEffect, useCallback } from "react";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CheckSquare, Zap, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { awardPoints, getTaskPoints } from "@/utils/gamification";
import { useBlastMode } from "@/lib/BlastModeContext";
import PointsToast from "../components/PointsToast";
import { Button } from "@/components/ui/button";
import MobileSelect from "../components/MobileSelect";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";
import BatchToolbar from "../components/BatchToolbar";
import TaskDetailModal from "../components/TaskDetailModal";
import RoomView from "../components/RoomView";
import { differenceInDays, parseISO } from "date-fns";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reward, setReward] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [familyMembers, setFamilyMembers] = useState([]);
  const [groupBy, setGroupBy] = useState("none");
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const { isActive: blastActive } = useBlastMode();

  const loadTasks = useCallback(async () => {
    const all = await base44.entities.Task.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    base44.entities.FamilyMember.list().then(setFamilyMembers);
  }, []);

  usePullToRefresh(loadTasks);

  async function handleComplete(task) {
    if (task.status !== "Completed") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const nextDue = new Date(today);
      nextDue.setDate(nextDue.getDate() + task.frequency_days);

      // Streak: increment if last completed within 2x frequency window (daily tasks only), else reset to 1
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
      const result = await awardPoints(task, blastActive);
      if (result) {
        setReward(result);
      }
      loadTasks();
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Pending" } : t));
      await base44.entities.Task.update(task.id, { status: "Pending" });
      loadTasks();
    }
  }

  async function handleDelete(task) {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    await base44.entities.Task.delete(task.id);
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBatchComplete() {
    const today = new Date();
    const selected = tasks.filter(t => selectedIds.has(t.id));
    await Promise.all(selected.map(task => {
      const nextDue = new Date(today);
      nextDue.setDate(nextDue.getDate() + task.frequency_days);
      return base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: today.toISOString().split("T")[0],
        next_due_date: nextDue.toISOString().split("T")[0],
      });
    }));
    setBatchMode(false);
    setSelectedIds(new Set());
    loadTasks();
  }

  async function handleBatchDelete() {
    const selected = [...selectedIds];
    await Promise.all(selected.map(id => base44.entities.Task.delete(id)));
    setBatchMode(false);
    setSelectedIds(new Set());
    loadTasks();
  }

  async function handleBatchReassign(member) {
    const selected = tasks.filter(t => selectedIds.has(t.id));
    await Promise.all(selected.map(task =>
      base44.entities.Task.update(task.id, {
        assigned_to: member?.id || null,
        assigned_to_name: member?.name || null,
      })
    ));
    setBatchMode(false);
    setSelectedIds(new Set());
    loadTasks();
  }

  const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];

  const filtered = tasks.filter(t => {
    if (t.category === "Car Maintenance") return false;
    const status = getStatusInfo(t);
    if (statusFilter === "overdue" && status.label !== "Overdue" && status.label !== "Past Due") return false;
    if (statusFilter === "due_soon" && status.label !== "Due Soon") return false;
    if (statusFilter === "completed" && status.label !== "Completed") return false;
    if (statusFilter === "pending" && status.label === "Completed") return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  }).sort((a, b) => {
    const aCompleted = a.status === "Completed";
    const bCompleted = b.status === "Completed";
    // Completed tasks go to the bottom
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    // Within completed, sort by last_completed_date descending (most recent first)
    if (aCompleted && bCompleted) {
      return new Date(b.last_completed_date || 0) - new Date(a.last_completed_date || 0);
    }
    // Non-completed: sort by next_due_date ascending
    return new Date(a.next_due_date) - new Date(b.next_due_date);
  });

  function getXpBucket(task) {
    const xp = getTaskPoints(task);
    if (xp >= 40) return "High XP (40+)";
    if (xp >= 20) return "Medium XP (20–39)";
    return "Low XP (< 20)";
  }

  function getFreqBucket(task) {
    const d = task.frequency_days;
    if (!d) return "Other";
    if (d <= 3) return "Daily / Every few days";
    if (d <= 7) return "Weekly";
    if (d <= 14) return "Bi-weekly";
    if (d <= 31) return "Monthly";
    return "Less than Monthly";
  }

  function groupTasks(tasks) {
    if (groupBy === "none") return [{ label: null, tasks }];
    const map = {};
    tasks.forEach(t => {
      const key = groupBy === "category" ? (t.category || "Uncategorized")
        : groupBy === "xp" ? getXpBucket(t)
        : getFreqBucket(t);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).map(([label, tasks]) => ({ label, tasks }));
  }

  const groups = groupTasks(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueToday = tasks.filter(t => {
    const due = parseISO(t.next_due_date);
    due.setHours(0, 0, 0, 0);
    return differenceInDays(due, today) === 0 && t.status !== "Completed";
  }).length;
  
  const overdue = tasks.filter(t => {
    const due = parseISO(t.next_due_date);
    due.setHours(0, 0, 0, 0);
    return differenceInDays(due, today) < 0 && t.status !== "Completed";
  }).length;

  return (
    <div className="space-y-4 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7">
      <div>
        <h1 className="font-heading text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} tasks</p>
      </div>
      <div className="flex gap-2 flex-col gap-3">
         <div className="flex gap-2">
           <Button onClick={() => setDialogOpen(true)} className="gap-2 flex-1 h-11 bg-blue-400 hover:bg-blue-500 border-blue-400">
             <Plus className="w-5 h-5" /> Add Task
           </Button>
           <Button
             variant="default"
             className="gap-2 flex-1 h-11 bg-blue-400 hover:bg-blue-500 border-blue-400"
             onClick={() => { setBatchMode(b => !b); setSelectedIds(new Set()); }}
           >
             <CheckSquare className="w-5 h-5" /> Select
           </Button>
         </div>
         <div className="flex gap-2">
           <Button 
             onClick={() => setViewMode("list")} 
             variant={viewMode === "list" ? "default" : "outline"}
             className="flex-1 h-10"
           >
             List View
           </Button>
           <Button 
             onClick={() => setViewMode("rooms")} 
             variant={viewMode === "rooms" ? "default" : "outline"}
             className="flex-1 h-10"
           >
             Rooms
           </Button>
         </div>
       </div>
      {viewMode === "list" && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStatusFilter("due_soon")} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 h-11 flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Due Today</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 ml-auto">{dueToday}</p>
          </button>
          <button onClick={() => setStatusFilter("overdue")} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 h-11 flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Overdue</p>
            <p className="text-lg font-bold text-red-900 dark:text-red-100 ml-auto">{overdue}</p>
          </button>
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex gap-2 w-full flex-col md:flex-row md:max-w-xs mx-auto md:mx-0">
          <MobileSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            title="Filter by Status"
            triggerClassName="flex-1 min-w-0 text-sm h-10"
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "overdue", label: "Overdue" },
              { value: "due_soon", label: "Due Soon" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <MobileSelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            title="Filter by Category"
            triggerClassName="flex-1 min-w-0 text-sm h-10"
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map(c => ({ value: c, label: c })),
            ]}
          />
          <MobileSelect
            value={groupBy}
            onValueChange={setGroupBy}
            title="Group By"
            triggerClassName="flex-1 min-w-0 text-sm h-10"
            options={[
              { value: "none", label: "No Grouping" },
              { value: "category", label: "Group by Category" },
              { value: "xp", label: "Group by XP" },
              { value: "frequency", label: "Group by Frequency" },
            ]}
          />
        </div>
      )}

      {viewMode === "list" ? (
        filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-xs text-muted-foreground">No tasks match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ label, tasks: groupTasks }) => (
              <div key={label || "all"}>
                {label && (
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-0.5">{label}</h2>
                )}
                <div className="space-y-2">
                  {groupTasks.map(task => (
                    <div key={task.id} className="relative group w-full flex items-center gap-2">
                      {batchMode && (
                        <button
                          onClick={() => toggleSelect(task.id)}
                          className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedIds.has(task.id)
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 bg-transparent"
                          }`}
                        >
                          {selectedIds.has(task.id) && <CheckSquare className="w-3 h-3 text-white" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0" onClick={batchMode ? () => toggleSelect(task.id) : undefined}>
                        <TaskCard task={task} onComplete={batchMode ? undefined : handleComplete} onViewDetails={batchMode ? undefined : setSelectedTask} />
                      </div>
                      {!batchMode && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="absolute top-10 right-2 p-1 rounded-lg bg-card/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
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
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <RoomView tasks={tasks} onComplete={handleComplete} onViewDetails={setSelectedTask} onDelete={handleDelete} />
      )}

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
      <TaskDetailModal task={selectedTask} open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }} />
      <BatchToolbar
        selectedCount={selectedIds.size}
        familyMembers={familyMembers}
        onComplete={handleBatchComplete}
        onDelete={handleBatchDelete}
        onReassign={handleBatchReassign}
        onCancel={() => { setBatchMode(false); setSelectedIds(new Set()); }}
      />
    </div>
  );
}