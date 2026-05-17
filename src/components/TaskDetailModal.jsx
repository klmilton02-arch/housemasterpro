import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO, addDays } from "date-fns";
import { Pencil, Trash2, Calendar, Clock, X, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { awardPoints } from "@/utils/gamification";

export default function TaskDetailModal({ task, open, onOpenChange, onModify, onDelete, onChangeDueDate, onComplete }) {
  const [dueDateInput, setDueDateInput] = useState(task?.next_due_date || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changeDueDateOpen, setChangeDueDateOpen] = useState(false);
  const [deletingCalendar, setDeletingCalendar] = useState(false);
  const [completeAsOpen, setCompleteAsOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [completingAs, setCompletingAs] = useState(null);

  useEffect(() => {
    if (open) {
      base44.entities.FamilyMember.list().then(setFamilyMembers);
    }
  }, [open]);
  
  async function handleDelete() {
    if (!task || !task.id) return;
    // Delete from Google Calendar if synced
    if (task.calendar_event_id) {
      try {
        await base44.functions.invoke('deleteCalendarEvent', { taskId: task.id });
      } catch (error) {
        console.error('Failed to delete calendar event:', error);
      }
    }
    try {
      await base44.entities.Task.delete(task.id);
    } catch (err) {
      // Task already deleted or not found — treat as success
      console.warn('Task delete warning:', err.message);
    }
    onDelete?.(task);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  }

  async function handleChangeDueDate() {
    if (!dueDateInput || !task?.id) return;
    await onChangeDueDate?.(task, dueDateInput);
    setChangeDueDateOpen(false);
    onOpenChange(false);
  }

  async function handleDefer(daysToAdd) {
    if (!task?.id) return;
    const newDate = addDays(parseISO(task.next_due_date), daysToAdd);
    const newDateStr = newDate.toISOString().split("T")[0];
    await onChangeDueDate?.(task, newDateStr);
    onOpenChange(false);
  }

  async function handleCompleteAs(member) {
    if (!task?.id) return;
    setCompletingAs(member.id);
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
    await base44.entities.Task.update(task.id, {
      status: "Completed",
      last_completed_date: todayStr,
      next_due_date: nextDueStr,
      assigned_to: member.id,
      assigned_to_name: member.name,
      completed_by_name: member.name,
    });
    // Award XP to the current user
    try { await awardPoints(task, false); } catch (e) { /* non-fatal */ }
    setCompletingAs(null);
    setCompleteAsOpen(false);
    onComplete?.(task);
    onOpenChange(false);
  }

  async function handleDeleteCalendarEvent() {
    if (!task?.id || !task?.calendar_event_id) return;
    setDeletingCalendar(true);
    try {
      await base44.functions.invoke('deleteCalendarEvent', { taskId: task.id });
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
    } finally {
      setDeletingCalendar(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{task?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task details */}
          <div className="space-y-2 text-sm">
            {task?.assigned_to_name && (
              <div>
                <span className="text-muted-foreground">Person:</span> {task.assigned_to_name}
              </div>
            )}
            {task?.next_due_date && (
              <div>
                <span className="text-muted-foreground">Due:</span> {format(parseISO(task.next_due_date), "MMM d, yyyy")}
              </div>
            )}
            {task?.category && (
              <div>
                <span className="text-muted-foreground">Room:</span> {task.category}
              </div>
            )}
            {task?.description && (
              <div>
                <span className="text-muted-foreground">Notes:</span> {task.description}
              </div>
            )}
            {task?.calendar_event_id && (
              <div className="text-xs text-green-600">
                ✓ Synced to Google Calendar
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 border-t border-border pt-4">
            {/* Complete as family member */}
            {familyMembers.length > 0 && (
              <div>
                <Button
                className="w-full gap-2 bg-green-200 hover:bg-green-300 text-green-900"
                onClick={() => setCompleteAsOpen(v => !v)}
                >
                <Users className="w-4 h-4" />
                Complete as Family Member
                </Button>
                {completeAsOpen && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {familyMembers.map(m => (
                      <Button
                        key={m.id}
                        variant="outline"
                        className="gap-2 justify-start"
                        disabled={completingAs === m.id}
                        onClick={() => handleCompleteAs(m)}
                      >
                        <div className={`w-5 h-5 rounded-full bg-${m.avatar_color}-500 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {m.name[0]}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2 bg-blue-200 hover:bg-blue-300 text-blue-900"
                onClick={() => {
                  onModify?.(task);
                  onOpenChange(false);
                }}
              >
                <Pencil className="w-4 h-4" />
                Modify
              </Button>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    className="flex-1 gap-2 bg-red-200 hover:bg-red-300 text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{task?.name}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {task?.calendar_event_id && (
              <Button
                className="w-full gap-2 bg-red-100 hover:bg-red-200 text-red-800"
                onClick={handleDeleteCalendarEvent}
                disabled={deletingCalendar}
              >
                <X className="w-4 h-4" />
                {deletingCalendar ? 'Removing...' : 'Remove from Calendar'}
              </Button>
            )}
            <AlertDialog open={changeDueDateOpen} onOpenChange={setChangeDueDateOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full gap-2 bg-blue-200 hover:bg-blue-300 text-blue-900"
                >
                  <Calendar className="w-4 h-4" />
                  Change Due Date
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Due Date</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Quick Defer:</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDefer(1)}
                        className="flex-1 gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900"
                      >
                        <Clock className="w-4 h-4" />
                        Tomorrow
                      </Button>
                      <Button
                        onClick={() => handleDefer(task?.frequency_days || 1)}
                        className="flex-1 gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900"
                      >
                        <Clock className="w-4 h-4" />
                        Next Schedule
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-medium text-foreground mb-2">Custom Date:</p>
                    <input
                      type="date"
                      value={dueDateInput}
                      onChange={(e) => setDueDateInput(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleChangeDueDate}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Save Custom Date
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}