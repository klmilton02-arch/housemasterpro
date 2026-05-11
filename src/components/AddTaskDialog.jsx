import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "./MobileSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFrequency } from "./TaskCard";
import { format } from "date-fns";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddTaskDialog({ open, onOpenChange, onTaskAdded, initialPreset = null }) {
  const [presets, setPresets] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [tab, setTab] = useState("preset");

  // To-do form
  const [todoName, setTodoName] = useState("");
  const [todoPriority, setTodoPriority] = useState("Medium");
  const [todoDueDate, setTodoDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [todoDescription, setTodoDescription] = useState("");

  // Preset form
  const [selectedPresets, setSelectedPresets] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  // Common fields
  const [assignedTo, setAssignedTo] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [freqValue, setFreqValue] = useState("");
  const [freqUnit, setFreqUnit] = useState("days");
  const [billDayOfMonth, setBillDayOfMonth] = useState("1");
  const [useBillDay, setUseBillDay] = useState(false);
  const [streamingServiceName, setStreamingServiceName] = useState("");
  const [phoneBillType, setPhoneBillType] = useState("");
  const [insuranceType, setInsuranceType] = useState("");

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
   const [customPriority, setCustomPriority] = useState("Medium");

   const [customRoom, setCustomRoom] = useState("");

   const isCarMaintenance = false;
   const [customDescription, setCustomDescription] = useState("");

  // Scan state
  const [scanType, setScanType] = useState("appointment"); // "appointment" | "task_list"
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDialogLoading(true);
      Promise.all([
        base44.entities.PresetTask.list().catch(() => []),
        base44.entities.FamilyMember.list().catch(() => []),
      ]).then(([p, f]) => {
        setPresets(p || []);
        setFamilyMembers(f || []);
        setDialogLoading(false);
      }).catch(err => {
        console.error("Failed to load presets/family members:", err);
        setPresets([]);
        setFamilyMembers([]);
        setDialogLoading(false);
      });

      if (initialPreset) {
        setSelectedPresets(new Set([initialPreset.id]));
        setTab("preset");
        if (initialPreset.frequency_days % 365 === 0) { setFreqValue(String(initialPreset.frequency_days / 365)); setFreqUnit("yearly"); }
        else if (initialPreset.frequency_days % 90 === 0) { setFreqValue(String(initialPreset.frequency_days / 90)); setFreqUnit("quarterly"); }
        else if (initialPreset.frequency_days % 30 === 0) { setFreqValue(String(initialPreset.frequency_days / 30)); setFreqUnit("months"); }
        else if (initialPreset.frequency_days % 7 === 0) { setFreqValue(String(initialPreset.frequency_days / 7)); setFreqUnit("weeks"); }
        else { setFreqValue(String(initialPreset.frequency_days)); setFreqUnit("days"); }
      } else {
        setSelectedPresets(new Set());
        setTab("preset");
      }
    }
  }, [open, initialPreset]);

  const allPresets = presets.filter(p => p.category !== "Car Maintenance");
  const categories = [...new Set(allPresets.map(p => p.task_type).filter(Boolean))];
  const rooms = [...new Set(allPresets.filter(p => p.task_type !== "Personal").map(p => p.category).filter(Boolean))].sort();
  const filteredPresets = allPresets.filter(p => 
    (categoryFilter === "all" || p.task_type === categoryFilter) &&
    (roomFilter === "all" || p.category === roomFilter)
  );

  async function handleSubmit() {
    setLoading(true);
    const me = await base44.auth.me();
    const family_group_id = me?.family_group_id || null;
    const member = familyMembers.find(m => m.id === assignedTo);

    const getRoomFromCategory = (cat) => {
      if (cat.includes("Bathroom")) return "Bathroom";
      if (cat.includes("Kitchen")) return "Kitchen";
      if (cat.includes("Bedroom")) return "Bedroom";
      if (cat.includes("Living") || cat.includes("Dining")) return "Living Room";
      if (cat.includes("Garage")) return "Garage";
      if (cat.includes("Laundry")) return "Laundry Room";
      return null;
    };

    if (tab === "todo") {
      await base44.entities.Task.create({
        name: todoName,
        category: "Personal",
        priority: todoPriority,
        difficulty: "Easy",
        frequency_days: 9999,
        description: todoDescription,
        assigned_to: assignedTo || undefined,
        assigned_to_name: member?.name || undefined,
        start_date: todoDueDate,
        next_due_date: todoDueDate,
        status: "Pending",
        overdue_grace_days: 999,
        family_group_id,
      });
      setTodoName("");
      setTodoPriority("Medium");
      setTodoDueDate(format(new Date(), "yyyy-MM-dd"));
      setTodoDescription("");
      setAssignedTo("");
      setLoading(false);
      onTaskAdded?.();
      return;
    } else if (tab === "preset") {
      // Create tasks for all selected presets
      const selectedPresetObjs = presets.filter(p => selectedPresets.has(p.id));
      
      for (const preset of selectedPresetObjs) {
        const isBill = preset.category === "Bill Schedules";
        const isStreaming = preset.name?.toLowerCase().includes("streaming");
        const isPhone = preset.name?.toLowerCase().includes("phone");
        const isInsurance = preset.name?.toLowerCase().includes("home insurance");

        let nextDueDate = startDate;
        if (isBill && useBillDay) {
          const day = parseInt(billDayOfMonth) || 1;
          const today = new Date();
          let candidate = new Date(today.getFullYear(), today.getMonth(), day);
          if (candidate < today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
          nextDueDate = format(candidate, "yyyy-MM-dd");
        }

        const freqDays = freqValue ? toDays(freqValue, freqUnit) : preset.frequency_days;

        await base44.entities.Task.create({
          name: isStreaming && streamingServiceName.trim()
            ? `Streaming Services (${streamingServiceName.trim()})`
            : isPhone && phoneBillType
            ? `${preset.name} (${phoneBillType})`
            : isInsurance && insuranceType
            ? `${preset.name} (${insuranceType})`
            : preset.name,
          category: preset.category,
          room: getRoomFromCategory(preset.category),
          difficulty: preset.difficulty,
          frequency_days: freqDays,
          frequency_miles: freqUnit === "miles" ? (parseInt(freqValue) || undefined) : undefined,
          description: preset.description,
          assigned_to: assignedTo || undefined,
          assigned_to_name: member?.name || undefined,
          start_date: startDate,
          next_due_date: nextDueDate,
          bill_day_of_month: (isBill && useBillDay) ? parseInt(billDayOfMonth) : undefined,
          status: "Pending",
          overdue_grace_days: 3,
          family_group_id,
        });
      }
    } else {
      // Create custom task
      const freqDays = freqValue ? toDays(freqValue, freqUnit) : 30;
      let customNextDue = startDate;
      if (customCategory === "Bills" && useBillDay) {
        const day = parseInt(billDayOfMonth) || 1;
        const today = new Date();
        let candidate = new Date(today.getFullYear(), today.getMonth(), day);
        if (candidate < today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
        customNextDue = format(candidate, "yyyy-MM-dd");
      }

      await base44.entities.Task.create({
        name: customName,
        category: customCategory,
        room: customRoom || undefined,
        priority: customPriority,
        difficulty: "Easy",
        frequency_days: freqDays,
        frequency_miles: freqUnit === "miles" ? (parseInt(freqValue) || undefined) : undefined,
        description: customDescription,
        assigned_to: assignedTo || undefined,
        assigned_to_name: member?.name || undefined,
        start_date: startDate,
        next_due_date: customNextDue,
        bill_day_of_month: (customCategory === "Bills" && useBillDay) ? parseInt(billDayOfMonth) : undefined,
        status: "Pending",
        overdue_grace_days: 3,
        family_group_id,
      });
    }

    setLoading(false);
    setSelectedPresets(new Set());
    setCustomName("");
    setCustomRoom("");
    setCategoryFilter("all");
    setRoomFilter("all");
    setFreqValue("");
    setFreqUnit("days");
    setUseBillDay(false);
    setBillDayOfMonth("1");
    setStreamingServiceName("");
    setPhoneBillType("");
    setInsuranceType("");
    setAssignedTo("");
    onTaskAdded?.();
  }

  async function handleScanFile(file) {
    if (!file) return;
    setScanning(true);
    setScanError(null);

    try {
      const url = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('scanAppointment', {
        file_url: url.file_url,
        scan_type: scanType
      });

      const extracted = response.data.extracted || response.extracted;
      if (!extracted) throw new Error('No data extracted');

      // If it's a task list, create multiple to-dos
      if (scanType === "task_list" && Array.isArray(extracted)) {
        const me = await base44.auth.me();
        const family_group_id = me?.family_group_id || null;
        
        for (const item of extracted) {
          await base44.entities.Task.create({
            name: item.task || item.title || "Unnamed task",
            category: "Personal",
            difficulty: "Easy",
            frequency_days: 9999,
            description: item.description || undefined,
            start_date: format(new Date(), "yyyy-MM-dd"),
            next_due_date: item.due_date || format(new Date(), "yyyy-MM-dd"),
            status: "Pending",
            overdue_grace_days: 999,
            family_group_id,
          });
        }
      } else if (scanType === "appointment" && typeof extracted === 'object') {
        // For appointments, create a single personal task
        const me = await base44.auth.me();
        const family_group_id = me?.family_group_id || null;
        
        await base44.entities.Task.create({
          name: extracted.doctor_name || "Appointment",
          category: "Personal",
          difficulty: "Easy",
          frequency_days: 9999,
          description: `${extracted.date || ""} ${extracted.time || ""} - ${extracted.location || ""}`.trim(),
          start_date: format(new Date(), "yyyy-MM-dd"),
          next_due_date: extracted.date || format(new Date(), "yyyy-MM-dd"),
          status: "Pending",
          overdue_grace_days: 999,
          family_group_id,
        });
      }

      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      onTaskAdded?.();
      setTab("preset");
    } catch (error) {
      setScanError(error.message || `Failed to scan ${scanType}. Please try again.`);
      setScanning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" aria-describedby="add-task-description">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Add Home Task</DialogTitle>
          <p id="add-task-description" className="hidden">Add a new home task by selecting presets or creating a custom task</p>
        </DialogHeader>

        {dialogLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <Tabs value={tab} onValueChange={setTab} className="mt-2" onPointerDownCapture={(e) => e.stopPropagation()}>
              <TabsList className="w-full">
                <TabsTrigger value="preset" className="flex-1 text-xs">Preset</TabsTrigger>
                <TabsTrigger value="custom" className="flex-1 text-xs">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="preset" className="space-y-4 mt-4">
            {initialPreset ? (
              // Launched from a specific preset card — show it directly, no list
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-3">
                <p className="font-semibold text-sm text-foreground">{initialPreset.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{initialPreset.category}{initialPreset.room ? ` · ${initialPreset.room}` : ""} · {formatFrequency(initialPreset.frequency_days)}</p>
                {initialPreset.description && <p className="text-xs text-muted-foreground mt-1">{initialPreset.description}</p>}
              </div>
            ) : (
              <>
                <div className="grid gap-3" style={{ gridTemplateColumns: categoryFilter === "Personal" ? "1fr" : "1fr 1fr" }}>
                   <div>
                     <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                     <MobileSelect
                     value={categoryFilter}
                     onValueChange={setCategoryFilter}
                     title="Filter by Type"
                     triggerClassName="mt-1"
                     forceSelect
                       options={[
                         { value: "all", label: "All Types" },
                         ...categories.map(c => ({ value: c, label: c })),
                       ]}
                     />
                   </div>
                   {categoryFilter !== "Personal" && (
                     <div>
                       <Label className="text-xs font-medium text-muted-foreground">Room</Label>
                       <MobileSelect
                         value={roomFilter}
                         onValueChange={setRoomFilter}
                         title="Filter by Room"
                         triggerClassName="mt-1"
                         forceSelect
                         options={[
                           { value: "all", label: "All Rooms" },
                           ...rooms.map(r => ({ value: r, label: r }))
                         ]}
                       />
                     </div>
                   )}
                 </div>
                 <div className="max-h-72 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {filteredPresets.map(p => (
                    <button
                      key={p.id}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedPresets.has(p.id)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => {
                        const newSelected = new Set(selectedPresets);
                        if (newSelected.has(p.id)) {
                          newSelected.delete(p.id);
                        } else {
                          newSelected.add(p.id);
                          // Set frequency from the last selected preset
                          const days = p.frequency_days;
                          if (days % 365 === 0) { setFreqValue(String(days / 365)); setFreqUnit("yearly"); }
                          else if (days % 90 === 0) { setFreqValue(String(days / 90)); setFreqUnit("quarterly"); }
                          else if (days % 30 === 0) { setFreqValue(String(days / 30)); setFreqUnit("months"); }
                          else if (days % 7 === 0) { setFreqValue(String(days / 7)); setFreqUnit("weeks"); }
                          else { setFreqValue(String(days)); setFreqUnit("days"); }
                        }
                        setSelectedPresets(newSelected);
                      }}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className={`text-xs mt-0.5 ${selectedPresets.has(p.id) ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {p.category}{p.task_type ? ` · ${p.task_type}` : ""} · {formatFrequency(p.frequency_days)}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {[...selectedPresets].map(id => presets.find(p => p.id === id)).some(p => p?.name?.toLowerCase().includes("home insurance")) && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-muted-foreground">Insurance Type (optional)</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Fire", "Flood", "Earthquake"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInsuranceType(insuranceType === type ? "" : type)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        insuranceType === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {insuranceType && (
                  <p className="text-xs text-muted-foreground mt-1">Tasks will include insurance type: <span className="font-medium text-foreground">({insuranceType})</span></p>
                )}
              </div>
            )}
            {[...selectedPresets].map(id => presets.find(p => p.id === id)).some(p => p?.name?.toLowerCase().includes("phone")) && (
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
                  <p className="text-xs text-muted-foreground mt-1">Tasks will include phone type: <span className="font-medium text-foreground">({phoneBillType})</span></p>
                )}
              </div>
            )}
            {[...selectedPresets].map(id => presets.find(p => p.id === id)).some(p => p?.name?.toLowerCase().includes("streaming")) && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-muted-foreground">Streaming Service Name</Label>
                <Input
                  value={streamingServiceName}
                  onChange={e => setStreamingServiceName(e.target.value)}
                  placeholder="e.g. Netflix, Hulu, Disney+"
                  className="mt-1"
                />
                {streamingServiceName.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">Tasks will use: <span className="font-medium text-foreground">Streaming Services ({streamingServiceName.trim()})</span></p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="todo" className="space-y-4 mt-4 hidden">
            <p className="text-xs text-muted-foreground">One-time personal tasks that don't repeat — great for to-do lists and errands.</p>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Task Name</Label>
              <Input value={todoName} onChange={e => setTodoName(e.target.value)} placeholder="e.g., Call the dentist" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
              <MobileSelect
                value={todoPriority}
                onValueChange={setTodoPriority}
                title="Select Priority"
                triggerClassName="mt-1"
                forceSelect
                options={[
                  { value: "High", label: "🔴 High" },
                  { value: "Medium", label: "🟡 Medium" },
                  { value: "Low", label: "⚪ Low" },
                ]}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Due Date</Label>
              <Input type="date" value={todoDueDate} onChange={e => setTodoDueDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
              <Input value={todoDescription} onChange={e => setTodoDescription(e.target.value)} placeholder="Any extra details" className="mt-1" />
            </div>
            {familyMembers.length > 0 && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Assign to (optional)</Label>
                <MobileSelect
                  value={assignedTo}
                  onValueChange={setAssignedTo}
                  title="Assign to"
                  triggerClassName="mt-1"
                  forceSelect
                  options={[{ value: "", label: "Unassigned" }, ...familyMembers.map(m => ({ value: m.id, label: m.name }))]}
                />
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || !todoName.trim()}
            >
              {loading ? "Adding..." : "Add To-Do"}
            </Button>
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
                forceSelect
                options={[
                  { value: "Cleaning", label: "Cleaning" },
                  { value: "Maintenance", label: "Maintenance" },
                  { value: "Bills", label: "Bills" },
                  { value: "Personal", label: "Personal" },
                  { value: "Garden", label: "Garden" },
                ]}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
              <MobileSelect
                value={customPriority}
                onValueChange={setCustomPriority}
                title="Select Priority"
                triggerClassName="mt-1"
                forceSelect
                options={[
                  { value: "High", label: "🔴 High" },
                  { value: "Medium", label: "🟡 Medium" },
                  { value: "Low", label: "⚪ Low" },
                ]}
              />
            </div>

            <div>
               <Label className="text-xs font-medium text-muted-foreground">Room (Optional)</Label>
               <MobileSelect
                 value={customRoom}
                 onValueChange={setCustomRoom}
                 title="Select Room"
                 triggerClassName="mt-1"
                 forceSelect
                 options={[
                   { value: "", label: "No room" },
                   { value: "Bedroom", label: "Bedroom (General)" },
                   { value: "Bedroom 1", label: "Bedroom 1" },
                   { value: "Bedroom 2", label: "Bedroom 2" },
                   { value: "Bedroom 3", label: "Bedroom 3" },
                   { value: "Bedroom 4", label: "Bedroom 4" },
                   { value: "Bedroom 5", label: "Bedroom 5" },
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

          <TabsContent value="scan" className="space-y-4 mt-4 hidden">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Scan Type</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setScanType("appointment")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-all ${
                      scanType === "appointment"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Appointment
                  </button>
                  <button
                    onClick={() => setScanType("task_list")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-all ${
                      scanType === "task_list"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Task List
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={scanning}
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
              </div>

              {scanning && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </div>
              )}

              {scanError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleScanFile(e.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleScanFile(e.target.files?.[0])}
              />
              </div>
              </TabsContent>
            </Tabs>

            <div className={`space-y-4 mt-4 pt-4 border-t border-border ${(tab !== "preset" && tab !== "custom") ? "hidden" : ""}`}>
          {/* Bill day-of-month option */}
          {((tab === "preset" && [...selectedPresets].map(id => presets.find(p => p.id === id)).some(p => p?.task_type === "Bills")) || (tab === "custom" && customCategory === "Bills")) && (
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
                    forceSelect
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
                  forceSelect
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

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || (tab === "preset" && selectedPresets.size === 0) || (tab === "custom" && !customName)}
            >
              {loading ? "Adding..." : "Add Task"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || (tab === "preset" && selectedPresets.size === 0) || (tab === "custom" && !customName)}
            >
              {loading ? "Adding..." : "Add & Continue"}
            </Button>
            </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}