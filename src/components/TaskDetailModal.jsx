import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO, addDays } from "date-fns";
import { Pencil, Trash2, Calendar, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

export default function TaskDetailModal({ task, open, onOpenChange, onModify, onDelete, onChangeDueDate }) {
  const [dueDateInput, setDueDateInput] = useState(task?.next_due_date || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changeDueDateOpen, setChangeDueDateOpen] = useState(false);
  
  async function handleDelete() {
    if (!task || !task.id) return;
    await base44.entities.Task.delete(task.id);
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
          </div>

          {/* Action buttons */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2 bg-blue-400 hover:bg-blue-500 text-white"
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
                    className="flex-1 gap-2 bg-red-400 hover:bg-red-500 text-white"
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
            <AlertDialog open={changeDueDateOpen} onOpenChange={setChangeDueDateOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full gap-2 bg-blue-400 hover:bg-blue-500 text-white"
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
                        className="flex-1 gap-2 bg-amber-400 hover:bg-amber-500 text-white"
                      >
                        <Clock className="w-4 h-4" />
                        Tomorrow
                      </Button>
                      <Button
                        onClick={() => handleDefer(task?.frequency_days || 1)}
                        className="flex-1 gap-2 bg-amber-400 hover:bg-amber-500 text-white"
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