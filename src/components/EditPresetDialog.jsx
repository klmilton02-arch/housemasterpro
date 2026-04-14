import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "./MobileSelect";

const CATEGORIES = [
  "Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning",
  "Living Areas", "Floors", "Deep Cleaning",
  "House Maintenance", "Bill Schedules",
];

const ROOMS = [
  "Kitchen", "Bathroom", "Bedroom", "Living Room", "Dining Room",
  "Garage", "Laundry Room", "Office", "Basement", "Attic", "Outdoor",
  "Whole House", "Any",
];

const FREQ_UNITS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function toDays(val, unit) {
  const n = parseInt(val) || 1;
  if (unit === "weeks") return n * 7;
  if (unit === "months") return n * 30;
  if (unit === "quarterly") return n * 90;
  if (unit === "yearly") return n * 365;
  return n;
}

function fromDays(days) {
  if (days % 365 === 0) return { val: String(days / 365), unit: "yearly" };
  if (days % 90 === 0) return { val: String(days / 90), unit: "quarterly" };
  if (days % 30 === 0) return { val: String(days / 30), unit: "months" };
  if (days % 7 === 0) return { val: String(days / 7), unit: "weeks" };
  return { val: String(days), unit: "days" };
}

export default function EditPresetDialog({ open, onOpenChange, preset, onSaved }) {
  const isNew = !preset?.id;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Living Areas");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");
  const [freqValue, setFreqValue] = useState("1");
  const [freqUnit, setFreqUnit] = useState("months");
  const [miles, setMiles] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(preset?.name || "");
      setCategory(preset?.category || "Living Areas");
      setDifficulty(preset?.difficulty || "Easy");
      setDescription(preset?.description || "");
      setRoom(preset?.room || "");
      setMiles(preset?.frequency_miles ? String(preset.frequency_miles) : "");
      const days = preset?.frequency_days;
      if (days) {
        const { val, unit } = fromDays(days);
        setFreqValue(val);
        setFreqUnit(unit);
      } else {
        setFreqValue("1");
        setFreqUnit("months");
      }
    }
  }, [open, preset]);

  const freqDays = toDays(freqValue, freqUnit);

  async function handleSave() {
    if (!name.trim() || !freqDays) return;
    setLoading(true);
    const data = {
      name: name.trim(),
      category,
      difficulty,
      description,
      frequency_days: freqDays,
      room: room || undefined,
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
            <MobileSelect
              value={category}
              onValueChange={setCategory}
              title="Select Category"
              triggerClassName="mt-1 w-full"
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Difficulty</Label>
            <MobileSelect
              value={difficulty}
              onValueChange={setDifficulty}
              title="Select Difficulty"
              triggerClassName="mt-1 w-full"
              options={[
                { value: "Trivial", label: "Trivial" },
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
                { value: "Very Hard", label: "Very Hard" },
              ]}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number" min="1"
                value={freqValue}
                onChange={e => setFreqValue(e.target.value)}
                placeholder="e.g., 2"
                className="flex-1"
              />
              <MobileSelect
                value={freqUnit}
                onValueChange={setFreqUnit}
                title="Frequency Unit"
                triggerClassName="w-32"
                options={FREQ_UNITS}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Room (optional)</Label>
            <MobileSelect
              value={room || ""}
              onValueChange={setRoom}
              title="Select Room"
              triggerClassName="mt-1 w-full"
              options={[{ value: "", label: "— None —" }, ...ROOMS.map(r => ({ value: r, label: r }))]}
            />
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