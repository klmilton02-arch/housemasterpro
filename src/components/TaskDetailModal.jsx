import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

export default function TaskDetailModal({ task, open, onOpenChange, onModify, onDelete, onChangeDueDate }) {
  const [dueDateInput, setDueDateInput] = useState(task?.next_due_date || "");
  async function handleDelete() {
    if (!task) return;
    await base44.entities.Task.delete(task.id);
    onDelete?.(task.id);
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
                <span className="text-muted-foreground">Category:</span> {task.category}
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
                className="flex-1 gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  onModify?.(task);
                  onOpenChange(false);
                }}
              >
                <Pencil className="w-4 h-4" />
                Modify
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                onChangeDueDate?.(task, dueDateInput);
                onOpenChange(false);
              }}
            >
              <Calendar className="w-4 h-4" />
              Change Due Date
            </Button>
            <input
              type="date"
              value={dueDateInput}
              onChange={(e) => setDueDateInput(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}