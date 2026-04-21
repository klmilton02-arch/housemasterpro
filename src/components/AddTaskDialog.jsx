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
  const [billDayOfMonth, setBillDayOfMonth] = useState("1");
  const [useBillDay, setUseBillDay] = useState(false);
  const [streamingServiceName, setStreamingServiceName] = useState("");
  const [phoneBillType, setPhoneBillType] = useState("");

  function toDays(val, unit) {
    const n = parseInt(val) || 1;
    if (unit === "weeks") return n * 7;
    if (unit === "months") return n * 30;
    if (unit === "quarterly") return n * 90;
    if (unit === "yearly") return n * 365;
    return n;
  }

  // Custom form
   const [customName, setCustomName] = useState("");
   const [customCategory, setCustomCategory] = useState("Cleaning");
   const [customRoom, setCustomRoom] = useState("");

   const isCarMaintenance = false;
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
          if (initialPreset.frequency_days % 365 === 0) { setFreqValue(String(initialPreset.frequency_days / 365)); setFreqUnit("yearly"); }
          else if (initialPreset.frequency_days % 90 === 0) { setFreqValue(String(initialPreset.frequency_days / 90)); setFreqUnit("quarterly"); }
          else if (initialPreset.frequency_days % 30 === 0) { setFreqValue(String(initialPreset.frequency_days / 30)); setFreqUnit("months"); }
          else if (initialPreset.frequency_days % 7 === 0) { setFreqValue(String(initialPreset.frequency_days / 7)); setFreqUnit("weeks"); }
          else { setFreqValue(String(initialPreset.frequency_days)); setFreqUnit("days"); }
        }
      });
    }
  }, [open, initialPreset]);

  const allPresets = presets.filter(p => p.category !== "Car Maintenance");
  const categories = [...new Set(allPresets.map(p => p.category))];
  const filteredPresets = categoryFilter === "all" ? allPresets : allPresets.filter(p => p.category === categoryFilter);

  async function handleSubmit() {
    setLoading(true);
    const member = familyMembers.find(m => m.id === assignedTo);

    const isBill = (tab === "preset" && selectedPreset?.category === "Bill Schedules") || (tab === "custom" && customCategory === "Bill Schedules");
    const isStreaming = tab === "preset" && selectedPreset?.name?.toLowerCase().includes("streaming");
    const isPhone = tab === "preset" && selectedPreset?.name?.toLowerCase().includes("phone");

    // If bill with specific day of month, compute next_due_date and set frequency to 30 days
    let nextDueDate = startDate;
    if (isBill && useBillDay) {
      const day = parseInt(billDayOfMonth) || 1;
      const today = new Date();
      let candidate = new Date(today.getFullYear(), today.getMonth(), day);
      if (candidate < today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
      nextDueDate = format(candidate, "yyyy-MM-dd");
    }

    const freqDays = freqValue ? toDays(freqValue, freqUnit) : (selectedPreset?.frequency_days || 30);

    const freqMiles = freqUnit === "miles" ? (parseInt(freqValue) || undefined) : undefined;

    const getRoomFromCategory = (cat) => {
      if (cat.includes("Bathroom")) return "Bathroom";
      if (cat.includes("Kitchen")) return "Kitchen";
      if (cat.includes("Bedroom")) return "Bedroom 1";
      if (cat.includes("Living") || cat.includes("Dining")) return "Living Room";
      if (cat.includes("Garage")) return "Garage";
      if (cat.includes("Laundry")) return "Laundry Room";
      return null;
    };

    const taskData = tab === "preset" && selectedPreset
       ? {
           name: isStreaming && streamingServiceName.trim()
             ? `Streaming Services (${streamingServiceName.trim()})`
             : isPhone && phoneBillType
             ? `${selectedPreset.name} (${phoneBillType})`
             : selectedPreset.name,
           category: selectedPreset.category,
           room: getRoomFromCategory(selectedPreset.category),
           difficulty: selectedPreset.difficulty,
           frequency_days: freqDays,
           frequency_miles: freqMiles,
           description: selectedPreset.description,
         }
       : {
           name: customName,
           category: customCategory,
           room: customRoom || undefined,
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
      next_due_date: nextDueDate,
      status: "Pending",
      overdue_grace_days: 3,
    });

    setLoading(false);
    setSelectedPreset(null);
    setCustomName("");
    setCustomRoom("");
    setFreqValue("");
    setFreqUnit("days");
    setUseBillDay(false);
    setBillDayOfMonth("1");
    setStreamingServiceName("");
    setPhoneBillType("");
    setAssignedTo("");
    onOpenChange(false);
    onTaskAdded?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Add Home Task</DialogTitle>
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
    if (p.category === "Car Maintenance") { setFreqValue(p.frequency_miles ? String(p.frequency_miles) : ""); setFreqUnit("miles"); }
    else if (p.frequency_days % 365 === 0) { setFreqValue(String(p.frequency_days / 365)); setFreqUnit("yearly"); }
    else if (p.frequency_days % 90 === 0) { setFreqValue(String(p.frequency_days / 90)); setFreqUnit("quarterly"); }
    else if (p.frequency_days % 30 === 0) { setFreqValue(String(p.frequency_days / 30)); setFreqUnit("months"); }
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
            {selectedPreset?.name?.toLowerCase().includes("phone") && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-muted-foreground">Phone Type (optional)</Label>
                <div className="flex gap-2 mt-1">
                  {["Mobile", "Landline"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPhoneBillType(phoneBillType === type ? "" : type)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        phoneBillType === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {phoneBillType && (
                  <p className="text-xs text-muted-foreground mt-1">Task will be named: <span className="font-medium text-foreground">{selectedPreset.name} ({phoneBillType})</span></p>
                )}
              </div>
            )}
            {selectedPreset?.name?.toLowerCase().includes("streaming") && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-muted-foreground">Streaming Service Name</Label>
                <Input
                  value={streamingServiceName}
                  onChange={e => setStreamingServiceName(e.target.value)}
                  placeholder="e.g. Netflix, Hulu, Disney+"
                  className="mt-1"
                />
                {streamingServiceName.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">Task will be named: <span className="font-medium text-foreground">Streaming Services ({streamingServiceName.trim()})</span></p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Task Name</Label>
              <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g., Deep clean kitchen" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Category</Label>
              <MobileSelect
                value={customCategory}
                onValueChange={setCustomCategory}
                title="Select Category"
                triggerClassName="mt-1"
                options={["Cleaning","Kitchen Cleaning","Bathroom Cleaning","Bedroom Cleaning","Living Areas","Floors","Deep Cleaning","House Maintenance","Bill Schedules"].map(c => ({ value: c, label: c }))}
              />
            </div>
            <div>
               <Label className="text-xs font-medium text-muted-foreground">Room (Optional)</Label>
               <MobileSelect
                 value={customRoom}
                 onValueChange={setCustomRoom}
                 title="Select Room"
                 triggerClassName="mt-1"
                 options={[
                   { value: "", label: "No room" },
                   { value: "Bedroom 1", label: "Bedroom 1" },
                   { value: "Bedroom 2", label: "Bedroom 2" },
                   { value: "Bedroom 3", label: "Bedroom 3" },
                   { value: "Bedroom 4", label: "Bedroom 4" },
                   { value: "Bathroom", label: "Bathroom" },
                   { value: "Half Bath", label: "Half Bath" },
                   { value: "Kitchen", label: "Kitchen" },
                   { value: "Living Room", label: "Living Room" },
                   { value: "Dining Room", label: "Dining Room" },
                   { value: "Garage", label: "Garage" },
                   { value: "Laundry Room", label: "Laundry Room" },
                   { value: "Mixed Use Room", label: "Mixed Use Room" },
                 ]}
               />
             </div>
             <div>
               <Label className="text-xs font-medium text-muted-foreground">Description</Label>
               <Input value={customDescription} onChange={e => setCustomDescription(e.target.value)} placeholder="Optional description" className="mt-1" />
             </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4 pt-4 border-t border-border">
          {/* Bill day-of-month option */}
          {((tab === "preset" && selectedPreset?.category === "Bill Schedules") || (tab === "custom" && customCategory === "Bill Schedules")) && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseBillDay(b => !b)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center ${useBillDay ? "bg-primary justify-end" : "bg-muted justify-start"}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow mx-0.5 block" />
                </button>
                <span className="text-sm font-medium text-foreground">Due on a specific day of the month</span>
              </div>
              {useBillDay && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Day of month:</Label>
                  <MobileSelect
                    value={billDayOfMonth}
                    onValueChange={setBillDayOfMonth}
                    title="Day of Month"
                    triggerClassName="w-24"
                    options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                  />
                  <span className="text-xs text-muted-foreground">of each month</span>
                </div>
              )}
            </div>
          )}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              {isCarMaintenance ? "Every (miles)" : "Frequency"}
            </Label>
            {isCarMaintenance ? (
              <Input
                type="number" min="1"
                value={freqValue}
                onChange={e => setFreqValue(e.target.value)}
                placeholder="e.g., 5000"
                className="mt-1"
              />
            ) : (
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  value={freqValue}
                  onChange={e => setFreqValue(e.target.value)}
                  placeholder="e.g., 2"
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
                    { value: "quarterly", label: "Quarterly" },
                    { value: "yearly", label: "Yearly" },
                  ]}
                />
              </div>
            )}
            {freqValue && !isCarMaintenance && freqUnit !== "miles" && (
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