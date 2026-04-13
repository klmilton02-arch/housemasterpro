import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "./MobileSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFrequency } from "./TaskCard";
import { format } from "date-fns";

export default function AddTaskDialog({ open, onOpenChange, onTaskAdded, initialPreset = null }) {
  const [presets, setPresets] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("preset");

  // Preset form
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Common fields
  const [assignedTo, setAssignedTo] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [freqValue, setFreqValue] = useState("");
  const [freqUnit, setFreqUnit] = useState("days");

  function toDays(val, unit) {
    const n = parseInt(val) || 1;
    if (unit === "weeks") return n * 7;
    if (unit === "months") return n * 30;
    if (unit === "miles") return 365;
    return n;
  }

  const isCarMaintenance = (tab === "preset" && selectedPreset?.category === "Car Maintenance") || (tab === "custom" && customCategory === "Car Maintenance");

  // Custom form
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Living Areas");
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.PresetTask.list(),
        base44.entities.FamilyMember.list(),
      ]).then(([p, f]) => {
        setPresets(p);
        setFamilyMembers(f);
        if (initialPreset) {
          setSelectedPreset(initialPreset);
          setTab("preset");
          if (initialPreset.frequency_days % 30 === 0) { setFreqValue(String(initialPreset.frequency_days / 30)); setFreqUnit("months"); }
          else if (initialPreset.frequency_days % 7 === 0) { setFreqValue(String(initialPreset.frequency_days / 7)); setFreqUnit("weeks"); }
          else { setFreqValue(String(initialPreset.frequency_days)); setFreqUnit("days"); }
        }
      });
    }
  }, [open, initialPreset]);

  const categories = [...new Set(presets.map(p => p.category))];
  const filteredPresets = categoryFilter === "all" ? presets : presets.filter(p => p.category === categoryFilter);

  async function handleSubmit() {
    setLoading(true);
    const member = familyMembers.find(m => m.id === assignedTo);

    const freqDays = freqValue ? toDays(freqValue, freqUnit) : (selectedPreset?.frequency_days || 30);

    const freqMiles = freqUnit === "miles" ? (parseInt(freqValue) || undefined) : undefined;

    const taskData = tab === "preset" && selectedPreset
      ? {
          name: selectedPreset.name,
          category: selectedPreset.category,
          difficulty: selectedPreset.difficulty,
          frequency_days: freqDays,
          frequency_miles: freqMiles,
          description: selectedPreset.description,
        }
      : {
          name: customName,
          category: customCategory,
          difficulty: "Easy",
          frequency_days: freqDays,
          frequency_miles: freqMiles,
          description: customDescription,
        };

    await base44.entities.Task.create({
      ...taskData,
      assigned_to: assignedTo || undefined,
      assigned_to_name: member?.name || undefined,
      start_date: startDate,
      next_due_date: startDate,
      status: "Pending",
      overdue_grace_days: 3,
    });

    setLoading(false);
    setSelectedPreset(null);
    setCustomName("");
    setFreqValue("");
    setFreqUnit("days");
    setAssignedTo("");
    onOpenChange(false);
    onTaskAdded?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Add New Task</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="preset" className="flex-1">From Preset</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom Task</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Category</Label>
              <MobileSelect
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                title="Filter by Category"
                triggerClassName="mt-1"
                options={[{ value: "all", label: "All Categories" }, ...categories.map(c => ({ value: c, label: c }))]}
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
              {filteredPresets.map(p => (
                <button
                  key={p.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedPreset?.id === p.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                  onClick={() => {
                    setSelectedPreset(p);
    // Set frequency display from preset
    if (p.frequency_days % 30 === 0) { setFreqValue(String(p.frequency_days / 30)); setFreqUnit("months"); }
    else if (p.frequency_days % 7 === 0) { setFreqValue(String(p.frequency_days / 7)); setFreqUnit("weeks"); }
    else { setFreqValue(String(p.frequency_days)); setFreqUnit("days"); }
                  }}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className={`text-xs mt-0.5 ${selectedPreset?.id === p.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatFrequency(p.frequency_days)} · {p.task_type}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Task Name</Label>
              <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g., Clean garage" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Category</Label>
              <MobileSelect
                value={customCategory}
                onValueChange={setCustomCategory}
                title="Select Category"
                triggerClassName="mt-1"
                options={["Kitchen Cleaning","Bathroom Cleaning","Bedroom Cleaning","Living Areas","Floors","Deep Cleaning","Car Maintenance","House Maintenance","Bill Schedules"].map(c => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Input value={customDescription} onChange={e => setCustomDescription(e.target.value)} placeholder="Optional description" className="mt-1" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4 pt-4 border-t border-border">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                min="1"
                value={freqValue}
                onChange={e => setFreqValue(e.target.value)}
                placeholder={selectedPreset ? String(tab === 'preset' ? (freqValue || '—') : '') : 'e.g., 2'}
                className="flex-1"
              />
              <MobileSelect
                value={freqUnit}
                onValueChange={setFreqUnit}
                title="Frequency Unit"
                triggerClassName="w-28"
                options={[
                  { value: "days", label: "Days" },
                  { value: "weeks", label: "Weeks" },
                  { value: "months", label: "Months" },
                  ...(isCarMaintenance ? [{ value: "miles", label: "Miles" }] : []),
                ]}
              />
            </div>
            {freqValue && freqUnit !== "miles" && (
              <p className="text-xs text-muted-foreground mt-1">{formatFrequency(toDays(freqValue, freqUnit))}</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || (tab === "preset" && !selectedPreset) || (tab === "custom" && !customName)}
          >
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}