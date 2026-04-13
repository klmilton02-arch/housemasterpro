import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning",
  "Living Areas", "Floors", "Deep Cleaning",
  "House Maintenance", "Bill Schedules",
];

const FREQ_PRESETS = [
  { label: "Daily", days: 1 },
  { label: "Every 3 days", days: 3 },
  { label: "Weekly", days: 7 },
  { label: "Bi-weekly", days: 14 },
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
  { label: "Every 6 months", days: 180 },
  { label: "Annually", days: 365 },
  { label: "Custom", days: null },
];

export default function EditPresetDialog({ open, onOpenChange, preset, onSaved }) {
  const isNew = !preset?.id;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Living Areas");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");
  const [freqChoice, setFreqChoice] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [miles, setMiles] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(preset?.name || "");
      setCategory(preset?.category || "Living Areas");
      setDifficulty(preset?.difficulty || "Easy");
      setDescription(preset?.description || "");
      setMiles(preset?.frequency_miles ? String(preset.frequency_miles) : "");
      const days = preset?.frequency_days;
      const match = FREQ_PRESETS.find(f => f.days === days);
      if (match && match.days !== null) {
        setFreqChoice(String(match.days));
        setCustomDays("");
      } else if (days) {
        setFreqChoice("custom");
        setCustomDays(String(days));
      } else {
        setFreqChoice("30");
        setCustomDays("");
      }
    }
  }, [open, preset]);

  const freqDays = freqChoice === "custom" ? parseInt(customDays) || 0 : parseInt(freqChoice);

  async function handleSave() {
    if (!name.trim() || !freqDays) return;
    setLoading(true);
    const data = {
      name: name.trim(),
      category,
      difficulty,
      description,
      frequency_days: freqDays,
    };
    if (isNew) {
      await base44.entities.PresetTask.create(data);
    } else {
      await base44.entities.PresetTask.update(preset.id, data);
    }
    setLoading(false);
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{isNew ? "New Preset" : "Edit Preset"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Clean oven" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Trivial">Trivial</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
                <SelectItem value="Very Hard">Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <Select value={freqChoice} onValueChange={setFreqChoice}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQ_PRESETS.map(f => (
                  <SelectItem key={f.label} value={f.days !== null ? String(f.days) : "custom"}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {freqChoice === "custom" && (
              <Input
                type="number" min="1"
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder="Number of days"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" className="mt-1" />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={loading || !name.trim() || !freqDays}>
            {loading ? "Saving..." : isNew ? "Create Preset" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}