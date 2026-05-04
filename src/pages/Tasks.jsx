import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CheckSquare, Zap, Calendar, AlertTriangle, ChevronDown, ListChecks, Clock, CheckCircle, Tag, Receipt, Home, Filter, Leaf } from "lucide-react";
import { useLargeIcons } from "@/lib/LargeIconsContext";
import { Link, useNavigate } from "react-router-dom";
import { awardPoints, getTaskPoints, revokePoints } from "@/utils/gamification";
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
import YesterdayTasksDialog from "../components/YesterdayTasksDialog";
import CompleteAsSheet from "../components/CompleteAsSheet";
import CompletingAsCard from "../components/CompletingAsCard";
import { differenceInDays, parseISO, subDays, format } from "date-fns";

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reward, setReward] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [familyMembers, setFamilyMembers] = useState([]);
  const [groupBy, setGroupBy] = useState("category");
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [assignedFilter, setAssignedFilter] = useState("all"); // "all" | "assigned" | "unassigned"
  const [roomFilter, setRoomFilter] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [justCompleted, setJustCompleted] = useState(new Set());
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "cleaning" | "maintenance"
  const [yesterdayTasks, setYesterdayTasks] = useState([]);
  const [showYesterdayDialog, setShowYesterdayDialog] = useState(false);
  const [completeAsSheet, setCompleteAsSheet] = useState(null); // task pending completion
  const [activeCompletingAs, setActiveCompletingAs] = useState(null); // globally selected member
  const { isActive: blastActive } = useBlastMode();
  const { largeIcons } = useLargeIcons();
  // Swipe navigation disabled on Tasks — conflicts with vertical scrolling
  const handleTouchStart = () => {};
  const handleTouchEnd = () => {};

  const loadTasks = useCallback(async () => {
    const me = await base44.auth.me();
    let all;
    if (me?.family_group_id) {
      all = await base44.entities.Task.filter({ family_group_id: me.family_group_id }, "-created_date", 500);
    } else {
      all = await base44.entities.Task.filter({ created_by: me?.email }, "-created_date", 500);
    }
    setTasks(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Show yesterday's missed tasks once per day on first load
  useEffect(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const seenKey = `yesterday_prompt_${todayKey}`;
    if (localStorage.getItem(seenKey)) return;

    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const missed = tasks.filter(t =>
      t.next_due_date === yesterday && t.status !== "Completed"
    );
    if (missed.length > 0) {
      setYesterdayTasks(missed);
      setShowYesterdayDialog(true);
      localStorage.setItem(seenKey, "1");
    } else if (tasks.length > 0) {
      // Mark as seen even if no missed tasks so we don't re-check every render
      localStorage.setItem(seenKey, "1");
    }
  }, [tasks]);

  useEffect(() => {
    base44.entities.FamilyMember.list().then(setFamilyMembers);
  }, []);

  usePullToRefresh(loadTasks);

  async function handleComplete(task, completedByMember) {
    if (task.status !== "Completed") {
      // If a global member is selected, use them directly
      if (completedByMember === undefined && activeCompletingAs) {
        completedByMember = activeCompletingAs;
      }
      // Only show picker if no global selection AND explicitly no member passed
      // (null activeCompletingAs = "Me", skip the picker)

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      let nextDueStr;
      if (task.bill_day_of_month) {
        const day = task.bill_day_of_month;
        let candidate = new Date(today.getFullYear(), today.getMonth(), day);
        if (candidate <= today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
        nextDueStr = candidate.toISOString().split("T")[0];
      } else {
        const nextDue = new Date(today);
        nextDue.setDate(nextDue.getDate() + task.frequency_days);
        nextDueStr = nextDue.toISOString().split("T")[0];
      }

      // Use selected member name or fall back to current user
      const currentUser = await base44.auth.me();
      const completedByName = completedByMember?.name || currentUser?.full_name || currentUser?.email || "Someone";

      // Streak: increment if last completed within 2x frequency window (daily tasks only), else reset to 1
      let newStreak = 1;
      if (task.frequency_days <= 1 && task.last_completed_date) {
        const daysSinceLast = differenceInDays(today, parseISO(task.last_completed_date));
        newStreak = daysSinceLast <= 2 ? (task.streak || 0) + 1 : 1;
      }

      // Mark as visually complete immediately (shows green + checkmark)
      // Don't update task.status yet — TaskCard uses justCompleted for the visual state
      setJustCompleted(prev => new Set([...prev, task.id]));

      // Fire confetti + XP toast instantly
      const immediatePoints = getTaskPoints(task) * (blastActive ? 2 : 1);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setReward({ totalPoints: immediatePoints, blastBonus: blastActive });

      // Award points + DB write in background
      // If completing as a specific member, override the task's assigned fields
      const taskForPoints = completedByMember
        ? { ...task, assigned_to: completedByMember.id, assigned_to_name: completedByMember.name }
        : task;
      awardPoints(taskForPoints, blastActive).then(result => {
        if (result && (result.leveledUp || result.newBadges?.length > 0)) {
          setReward(result);
        }
      });

      base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: todayStr,
        next_due_date: nextDueStr,
        streak: newStreak,
        completed_with_blast: blastActive,
        completed_by_name: completedByName,
      });

      // After 2.5s pause: move task to bottom of list
      setTimeout(() => {
        setTasks(prev => {
          const updated = prev.map(t => t.id === task.id ? { ...t, status: "Completed", last_completed_date: todayStr, next_due_date: nextDueStr, streak: newStreak, completed_with_blast: blastActive } : t);
          return updated;
        });
      }, 2500);
      // Remove from justCompleted after the move so green stays during animation
      setTimeout(() => {
        setJustCompleted(prev => { const next = new Set(prev); next.delete(task.id); return next; });
      }, 2900);
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Pending" } : t));
      const wasBlastRunning = task.completed_with_blast || false;
      revokePoints(task, wasBlastRunning);
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
      let nextDueStr;
      if (task.bill_day_of_month) {
        const day = task.bill_day_of_month;
        let candidate = new Date(today.getFullYear(), today.getMonth(), day);
        if (candidate <= today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
        nextDueStr = candidate.toISOString().split("T")[0];
      } else {
        const nextDue = new Date(today);
        nextDue.setDate(nextDue.getDate() + task.frequency_days);
        nextDueStr = nextDue.toISOString().split("T")[0];
      }
      return base44.entities.Task.update(task.id, {
        status: "Completed",
        last_completed_date: today.toISOString().split("T")[0],
        next_due_date: nextDueStr,
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
    if (differenceInDays(due, today) !== 0) return false;
    // Include if not completed, OR if completed but not today (recurring task due again)
    if (t.status !== "Completed") return true;
    if (t.last_completed_date) {
      const lastCompleted = parseISO(t.last_completed_date);
      lastCompleted.setHours(0, 0, 0, 0);
      return differenceInDays(today, lastCompleted) !== 0;
    }
    return false;
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
    <div className="space-y-2 md:space-y-6 w-full md:max-w-2xl md:mx-auto px-4 pt-6" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <h1 className="font-heading text-4xl font-bold md:hidden">Tasks</h1>

      <div className="grid grid-cols-2 gap-4 sm:gap-5">
         <button onClick={() => setDialogOpen(true)} className="w-full h-full">
           <StatCard large={largeIcons} icon={Plus} value="Add" label="New Task" color="bg-blue-100 text-blue-600" />
         </button>
         <button onClick={() => navigate("/presets")} className="w-full h-full">
           <StatCard large={largeIcons} icon={CheckCircle} value="Browse" label="Presets" color="bg-purple-100 text-purple-600" />
         </button>
         <button onClick={() => { if (categoryFilter === "Bill Schedules") { setCategoryFilter("all"); } else { setViewMode("list"); setCategoryFilter("Bill Schedules"); } }} className="w-full h-full">
           <StatCard large={largeIcons} icon={Receipt} value="View" label="Bills" color="bg-green-100 text-green-600" />
         </button>
         <button onClick={() => { setViewMode("list"); setCategoryFilter(categoryFilter === "Personal" ? "all" : "Personal"); }} className="w-full h-full">
           <StatCard large={largeIcons} icon={Tag} value="View" label="Personal" color="bg-pink-100 text-pink-600" />
         </button>
         <button onClick={() => setViewMode(viewMode === "rooms" ? "list" : "rooms")} className="w-full h-full">
           <StatCard large={largeIcons} icon={Home} value="View by" label="Room" color="bg-orange-100 text-orange-600" />
         </button>
         <button onClick={() => { setViewMode("list"); setCategoryFilter(categoryFilter === "Garden" ? "all" : "Garden"); }} className="w-full h-full">
           <StatCard large={largeIcons} icon={Leaf} value="View" label="Garden" color="bg-lime-100 text-lime-600" />
         </button>
       </div>

      <div className="grid grid-cols-2 gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full border border-border rounded-lg px-4 py-3 hover:shadow-md transition-all bg-card hover:bg-muted/40 flex flex-col items-start justify-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">Filter</span>
              <span className="font-heading font-semibold text-base text-foreground">
                {statusFilter === "all" ? "Due Date" : statusFilter.replace("_", " ")}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {[
              { value: "all", label: "All Dates" },
              { value: "overdue", label: "Overdue" },
              { value: "due_soon", label: "Due Soon" },
              { value: "pending", label: "Upcoming" },
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
            <button className="w-full border border-border rounded-lg px-4 py-3 hover:shadow-md transition-all bg-card hover:bg-muted/40 flex flex-col items-start justify-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">Category</span>
             <span className="font-heading font-semibold text-base text-foreground">
               {categoryFilter === "all" ? "All" : categoryFilter}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
              <span className={categoryFilter === "all" ? "font-semibold text-primary" : ""}>All Types</span>
            </DropdownMenuItem>
            {(viewMode === "rooms" ? ["Cleaning", "Maintenance"] : ["Cleaning", "Maintenance", "Bills", "Personal", "Garden"]).map(cat => (
              <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat)}>
                <span className={categoryFilter === cat ? "font-semibold text-primary" : ""}>{cat}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>



      {/* Completing as card */}
      {familyMembers.length > 0 && (
        <CompletingAsCard
          familyMembers={familyMembers}
          activeCompletingAs={activeCompletingAs}
          onSelect={setActiveCompletingAs}
        />
      )}





      {viewMode === "list" ? (
        filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-xs text-muted-foreground">No tasks match your filters.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
            <div className="space-y-3">
              {groups.map(({ label, tasks: groupTasks }) => (
                <div key={label || "all"}>
                  {label && (
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-0.5">{label}</h3>
                  )}
                <div className="space-y-3">
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
                </>
                )
      ) : viewMode === "calendar" ? (
        <TaskCalendar tasks={tasks} onViewDetails={setSelectedTask} />
      ) : (
        <RoomView tasks={tasks} categoryFilter={categoryFilter} onComplete={handleComplete} onViewDetails={setSelectedTask} onDelete={handleDelete} onAddTask={(room) => { setDialogOpen(true); }} onRoomRenamed={loadTasks} justCompletedIds={justCompleted} />
      )}



      <CompleteAsSheet
        open={!!completeAsSheet}
        onOpenChange={(open) => { if (!open) setCompleteAsSheet(null); }}
        familyMembers={familyMembers}
        onSelect={(member) => {
          const task = completeAsSheet;
          setCompleteAsSheet(null);
          handleComplete(task, member);
        }}
      />

      {showYesterdayDialog && (
        <YesterdayTasksDialog
          tasks={yesterdayTasks}
          onComplete={handleComplete}
          onClose={() => setShowYesterdayDialog(false)}
        />
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
        onComplete={() => { setSelectedTask(null); loadTasks(); }}
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