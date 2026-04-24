import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ROOMS = [
  "Kitchen", "Full Bathroom", "Half Bathroom", "Bathroom", "Bedroom", "Living Room", "Dining Room",
  "Garage", "Laundry Room", "Office", "Basement", "Attic", "Outdoor", "Whole House", "Any"
];
const TASK_TYPES = ["Cleaning", "Maintenance", "Bills"];
const DIFFICULTIES = ["Trivial", "Easy", "Medium", "Hard", "Very Hard"];

const EMPTY = {
  name: "",
  category: "",
  task_type: "",
  frequency_days: 7,
  difficulty: "Easy",
  description: "",
};

export default function EditPresetDialog({ open, onOpenChange, preset, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{preset ? "Edit Preset" : "New Preset"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Task Name *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Clean oven" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Room</Label>
              <Select value={form.category || ""} onValueChange={v => set("category", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={form.task_type || ""} onValueChange={v => set("task_type", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frequency (days)</Label>
              <Input
                type="number"
                min={1}
                value={form.frequency_days}
                onChange={e => set("frequency_days", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty || "Easy"} onValueChange={v => set("difficulty", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description || ""}
              onChange={e => set("description", e.target.value)}
              placeholder="Optional notes..."
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? "Saving..." : preset ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}