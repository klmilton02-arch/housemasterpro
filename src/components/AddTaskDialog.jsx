import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFrequency } from "./TaskCard";
import { format } from "date-fns";

export default function AddTaskDialog({ open, onOpenChange, onTaskAdded }) {
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
  const [customFrequency, setCustomFrequency] = useState("");

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
      });
    }
  }, [open]);

  const categories = [...new Set(presets.map(p => p.category))];
  const filteredPresets = categoryFilter === "all" ? presets : presets.filter(p => p.category === categoryFilter);

  async function handleSubmit() {
    setLoading(true);
    const member = familyMembers.find(m => m.id === assignedTo);

    const taskData = tab === "preset" && selectedPreset
      ? {
          name: selectedPreset.name,
          category: selectedPreset.category,
          task_type: selectedPreset.task_type,
          frequency_days: customFrequency ? parseInt(customFrequency) : selectedPreset.frequency_days,
          description: selectedPreset.description,
        }
      : {
          name: customName,
          category: customCategory,
          task_type: "Regular",
          frequency_days: parseInt(customFrequency) || 30,
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
    setCustomFrequency("");
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
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
                    setCustomFrequency(String(p.frequency_days));
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
              <Select value={customCategory} onValueChange={setCustomCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning", "Living Areas", "Floors", "Deep Cleaning", "Car Maintenance", "House Maintenance", "Bill Schedules"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Input value={customDescription} onChange={e => setCustomDescription(e.target.value)} placeholder="Optional description" className="mt-1" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4 pt-4 border-t border-border">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Frequency (days)</Label>
            <Input
              type="number"
              value={customFrequency}
              onChange={e => setCustomFrequency(e.target.value)}
              placeholder="e.g., 30 for monthly"
              className="mt-1"
            />
            {customFrequency && (
              <p className="text-xs text-muted-foreground mt-1">{formatFrequency(parseInt(customFrequency))}</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
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