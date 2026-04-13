import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TaskDetailModal({ task, open, onOpenChange }) {
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && task) {
      loadSubtasks();
    }
  }, [open, task?.id]);

  async function loadSubtasks() {
    const subs = await base44.entities.Subtask.filter({ task_id: task.id });
    setSubtasks(subs);
  }

  async function addSubtask() {
    if (!newSubtask.trim()) return;
    setLoading(true);
    await base44.entities.Subtask.create({
      task_id: task.id,
      title: newSubtask.trim(),
      completed: false,
    });
    setNewSubtask("");
    await loadSubtasks();
    setLoading(false);
  }

  async function toggleSubtask(subtask) {
    await base44.entities.Subtask.update(subtask.id, { completed: !subtask.completed });
    await loadSubtasks();
  }

  async function deleteSubtask(id) {
    await base44.entities.Subtask.delete(id);
    await loadSubtasks();
  }

  const completed = subtasks.filter(s => s.completed).length;
  const total = subtasks.length;

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
                <span className="text-muted-foreground">Assigned to:</span> {task.assigned_to_name}
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

          {/* Subtasks section */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-sm">Subtasks</h3>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">{completed} of {total}</span>
              )}
            </div>

            {total > 0 && (
              <div className="w-full bg-secondary rounded-full h-1.5 mb-3">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-2 mb-4">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleSubtask(sub)}
                    className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                      sub.completed
                        ? "border-green-500 bg-green-500"
                        : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {sub.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${sub.completed ? "line-through text-muted-foreground" : ""}`}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addSubtask(); }}
                placeholder="Add a subtask..."
                className="text-sm h-8"
              />
              <Button
                size="sm"
                onClick={addSubtask}
                disabled={loading || !newSubtask.trim()}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}