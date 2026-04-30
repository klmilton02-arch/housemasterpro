import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ROOMS = [
  "Kitchen", "Full Bathroom", "Half Bathroom", "Bedroom", "Living Room", "Dining Room",
  "Garage", "Laundry Room", "Office", "Basement", "Attic", "Outdoor", "Whole House", "Any"
];
const TASK_TYPES = ["Cleaning", "Maintenance", "Bills", "Personal"];
const DIFFICULTIES = ["Trivial", "Easy", "Medium", "Hard", "Very Hard"];

const EMPTY = {
  name: "",
  category: "",
  task_type: "",
  frequency_days: 7,
  difficulty: "Easy",
  description: "",
};

export default function EditPresetDialog({ open, onOpenChange, preset, onSaved, onDeleted }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(preset ? { ...EMPTY, ...preset } : EMPTY);
    }
  }, [open, preset]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = {
      name: form.name.trim(),
      category: form.category || undefined,
      task_type: form.task_type || undefined,
      frequency_days: Number(form.frequency_days) || 7,
      difficulty: form.difficulty || "Easy",
      description: form.description || undefined,
    };
    if (preset?.id) {
      await base44.entities.PresetTask.update(preset.id, data);
    } else {
      await base44.entities.PresetTask.create(data);
    }
    setSaving(false);
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-violet-50 border-violet-100">
      <DialogHeader className="pb-2 border-b border-violet-100">
        <DialogTitle className="text-violet-800">{preset ? "Edit Preset" : "New Preset"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-violet-100">
          <Label className="text-violet-700 text-xs font-semibold uppercase tracking-wide">Task Name *</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Clean oven" className="mt-1 border-violet-200 focus:border-violet-400 bg-white" />
        </div>

        <div className="space-y-3">
          <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
            <Label className="text-teal-700 text-xs font-semibold uppercase tracking-wide">Type</Label>
            <Select value={form.task_type || ""} onValueChange={v => set("task_type", v)}>
              <SelectTrigger className="mt-1 border-teal-200 bg-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.task_type !== "Personal" && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <Label className="text-blue-700 text-xs font-semibold uppercase tracking-wide">Room (Optional)</Label>
              <Select value={form.category || ""} onValueChange={v => set("category", v)}>
                <SelectTrigger className="mt-1 border-blue-200 bg-white">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {ROOMS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <Label className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Frequency (days)</Label>
            <Input
              type="number"
              min={1}
              value={form.frequency_days}
              onChange={e => set("frequency_days", e.target.value)}
              className="mt-1 border-amber-200 bg-white"
            />
          </div>

          <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
            <Label className="text-pink-700 text-xs font-semibold uppercase tracking-wide">Difficulty</Label>
            <Select value={form.difficulty || "Easy"} onValueChange={v => set("difficulty", v)}>
              <SelectTrigger className="mt-1 border-pink-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-violet-100">
          <Label className="text-violet-700 text-xs font-semibold uppercase tracking-wide">Description</Label>
          <Textarea
            value={form.description || ""}
            onChange={e => set("description", e.target.value)}
            placeholder="Optional notes..."
            className="mt-1 resize-none border-violet-200 bg-white"
            rows={2}
          />
        </div>
      </div>

      <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row">
        {preset?.id && (
          <Button
            className="sm:mr-auto bg-red-100 hover:bg-red-200 text-red-700 border-0"
            onClick={async () => {
              if (!confirm(`Delete "${preset.name}"?`)) return;
              setDeleting(true);
              await base44.entities.PresetTask.delete(preset.id);
              setDeleting(false);
              onOpenChange(false);
              onDeleted?.(preset.id);
            }}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
        <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-100" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-violet-500 hover:bg-violet-600 text-white">
          {saving ? "Saving..." : preset ? "Save" : "Create"}
        </Button>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}