import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CheckSquare, Zap, Calendar, AlertTriangle, ChevronDown, ListChecks, Clock, CheckCircle, Tag, Receipt, Home, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { awardPoints, getTaskPoints } from "@/utils/gamification";
import confetti from "canvas-confetti";
import { useBlastMode } from "@/lib/BlastModeContext";
import PointsToast from "../components/PointsToast";
import { Button } from "@/components/ui/button";
import MobileSelect from "../components/MobileSelect";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TaskCard, { getStatusInfo } from "../components/TaskCard";
import AddTaskDialog from "../components/AddTaskDialog";
import StatCard from "../components/StatCard";
import BatchToolbar from "../components/BatchToolbar";
import TaskDetailModal from "../components/TaskDetailModal";
import EditTaskDialog from "../components/EditTaskDialog";
import RoomView from "../components/RoomView";
import TaskCalendar from "../components/TaskCalendar";
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
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [assignedFilter, setAssignedFilter] = useState("all"); // "all" | "assigned" | "unassigned"
  const [roomFilter, setRoomFilter] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [justCompleted, setJustCompleted] = useState(new Set());
  const { isActive: blastActive } = useBlastMode();
  // Swipe navigation disabled on Tasks — conflicts with vertical scrolling
  const handleTouchStart = () => {};
  const handleTouchEnd = () => {};

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
      const nextDueStr = nextDue.toISOString().split("T")[0];

      // Streak: increment if last completed within 2x frequency window (daily tasks only), else reset to 1
      let newStreak = 1;
      if (task.frequency_days <= 1 && task.last_completed_date) {
        const daysSinceLast = differenceInDays(today, parseISO(task.last_completed_date));
        newStreak = daysSinceLast <= 2 ? (task.streak || 0) + 1 : 1;
      }

      // Mark as visually complete immediately (shows green + checkmark)
      setJustCompleted(prev => new Set([...prev, task.id]));

      // Fire confetti + XP toast instantly
      const immediatePoints = getTaskPoints(task) * (blastActive ? 2 : 1);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setReward({ totalPoints: immediatePoints, blastBonus: blastActive });

      // Award points in background
      awardPoints(task, blastActive).then(result => {
        if (result && (result.leveledUp || result.newBadges?.length > 0)) {
          setReward(result);
        }
      });

      // Update DB immediately in background
      base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: todayStr,
        next_due_date: nextDueStr,
        streak: newStreak,
      });

      // After 2s: update task status in local state (triggers sort to bottom)
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Completed", last_completed_date: todayStr, next_due_date: nextDueStr, streak: newStreak } : t));
      }, 2000);
      // Remove from justCompleted slightly after so the green stays visible during the move
      setTimeout(() => {
        setJustCompleted(prev => { const next = new Set(prev); next.delete(task.id); return next; });
      }, 2400);
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

  async function handleChangeDueDate(task, newDate) {
    if (!newDate) return;
    await base44.entities.Task.update(task.id, { next_due_date: newDate });
    loadTasks();
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
  const rooms = [...new Set(tasks.map(t => t.room).filter(Boolean))].sort();

  const filtered = tasks.filter(t => {
    if (t.category === "Car Maintenance") return false;
    const status = getStatusInfo(t);
    if (statusFilter === "overdue" && status.label !== "Overdue" && status.label !== "Past Due") return false;
    if (statusFilter === "due_soon" && status.label !== "Due Soon") return false;
    if (statusFilter === "completed" && status.label !== "Completed") return false;
    if (statusFilter === "pending" && status.label === "Completed") return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (assignedFilter === "assigned" && !t.assigned_to) return false;
    if (assignedFilter === "unassigned" && t.assigned_to) return false;
    if (selectedMemberId && t.assigned_to !== selectedMemberId) return false;
    if (roomFilter !== "all" && t.room !== roomFilter) return false;
    return true;
  }).sort((a, b) => {
    // Tasks that were just completed stay in place for 1 second
    const aCompleted = a.status === "Completed" && !justCompleted.has(a.id);
    const bCompleted = b.status === "Completed" && !justCompleted.has(b.id);
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
  
  const dueSoon = tasks.filter(t => {
    const due = parseISO(t.next_due_date);
    due.setHours(0, 0, 0, 0);
    const days = differenceInDays(due, today);
    return days > 0 && days <= 3 && t.status !== "Completed";
  }).length;
  
  const overdue = tasks.filter(t => {
    const due = parseISO(t.next_due_date);
    due.setHours(0, 0, 0, 0);
    return differenceInDays(due, today) < 0 && t.status !== "Completed";
  }).length;

  const completedCount = tasks.filter(t => t.status === "Completed").length;
  const dueTasks = tasks.filter(t => {
    const s = getStatusInfo(t);
    return (s.label === "Overdue" || s.label === "Past Due" || s.label === "Due Soon" || s.label === "Upcoming") && t.status !== "Completed";
  });

  return (
    <div className="space-y-4 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div>
        <h1 className="font-heading text-3xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} tasks</p>
      </div>


      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-400 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base">Add Task</span>
        </button>
        <button
          onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
          className="bg-blue-400 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base">Calendar</span>
        </button>
        <button
          onClick={() => { if (categoryFilter === "Bill Schedules") { setCategoryFilter("all"); } else { setViewMode("list"); setCategoryFilter("Bill Schedules"); } }}
          className="bg-blue-400 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base">Bills</span>
        </button>
        <button
          onClick={() => setViewMode(viewMode === "rooms" ? "list" : "rooms")}
          className="bg-blue-400 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base">Rooms</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full bg-blue-400 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Filter className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-base truncate">
                {statusFilter === "all" ? "Status" : statusFilter.replace("_", " ")}
              </span>
              <ChevronDown className="w-4 h-4 ml-auto shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "overdue", label: "Overdue" },
              { value: "due_soon", label: "Due Soon" },
              { value: "completed", label: "Completed" },
            ].map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => { setViewMode("list"); setStatusFilter(opt.value); }}>
                <span className={statusFilter === opt.value ? "font-semibold text-primary" : ""}>{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full bg-blue-400 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-base truncate">
                {categoryFilter === "all" ? "Type" : categoryFilter}
              </span>
              <ChevronDown className="w-4 h-4 ml-auto shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {[
              { value: "all", label: "All Types" },
              { value: "Bill Schedules", label: "Bills" },
              { value: "Maintenance", label: "Maintenance" },
              { value: "Cleaning", label: "Cleaning" },
            ].map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => { setViewMode("list"); setCategoryFilter(opt.value); }}>
                <span className={categoryFilter === opt.value ? "font-semibold text-primary" : ""}>{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>



      {viewMode === "list" && (
        <>
          {familyMembers.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {familyMembers.map(member => {
                const count = tasks.filter(t => t.assigned_to === member.id && t.status !== "Completed").length;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setCategoryFilter("all");
                      setStatusFilter("all");
                      setGroupBy("none");
                    }}
                    className="bg-card border border-border rounded-lg p-3 h-11 flex items-center gap-2 hover:bg-muted/40 transition-colors"
                  >
                    <div className={`w-6 h-6 rounded-full bg-${member.avatar_color}-500 shrink-0 flex items-center justify-center text-white text-xs font-bold`}>
                      {member.name[0]}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate flex-1 text-left">{member.name}</p>
                    <p className="text-lg font-bold text-foreground">{count}</p>
                  </button>
                );
              })}
            </div>
          )}
        </>
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
                        <TaskCard task={task} onComplete={batchMode ? undefined : handleComplete} onViewDetails={batchMode ? undefined : setSelectedTask} isInJustCompleted={justCompleted.has(task.id)} />
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
      ) : viewMode === "calendar" ? (
        <TaskCalendar tasks={tasks} onViewDetails={setSelectedTask} />
      ) : (
        <RoomView tasks={tasks} onComplete={handleComplete} onViewDetails={setSelectedTask} onDelete={handleDelete} onAddTask={(room) => { setDialogOpen(true); }} onRoomRenamed={loadTasks} justCompletedIds={justCompleted} />
      )}



      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onTaskAdded={loadTasks} />
      <PointsToast reward={reward} onDismiss={() => setReward(null)} />
      <TaskDetailModal 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        onModify={(task) => {
          setSelectedTask(null);
          setEditingTask(task);
        }}
        onDelete={handleDelete}
        onChangeDueDate={handleChangeDueDate}
      />
      <EditTaskDialog task={editingTask} open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }} onTaskUpdated={loadTasks} />
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