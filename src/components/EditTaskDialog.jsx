import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "./MobileSelect";
import { formatFrequency } from "./TaskCard";
import { format } from "date-fns";

export default function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated }) {
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [room, setRoom] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [freqValue, setFreqValue] = useState("");
  const [freqUnit, setFreqUnit] = useState("days");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    if (open && task) {
      base44.entities.FamilyMember.list().then(setFamilyMembers);
      
      setName(task.name || "");
      setCategory(task.category || "Cleaning");
      setRoom(task.room || "");
      setAssignedTo(task.assigned_to || "");
      setDescription(task.description || "");
      setStartDate(task.start_date || format(new Date(), "yyyy-MM-dd"));
      
      const days = task.frequency_days;
      if (days % 365 === 0) { setFreqValue(String(days / 365)); setFreqUnit("yearly"); }
      else if (days % 90 === 0) { setFreqValue(String(days / 90)); setFreqUnit("quarterly"); }
      else if (days % 30 === 0) { setFreqValue(String(days / 30)); setFreqUnit("months"); }
      else if (days % 7 === 0) { setFreqValue(String(days / 7)); setFreqUnit("weeks"); }
      else { setFreqValue(String(days)); setFreqUnit("days"); }
    }
  }, [open, task]);

  function toDays(val, unit) {
    const n = parseInt(val) || 1;
    if (unit === "weeks") return n * 7;
    if (unit === "months") return n * 30;
    if (unit === "quarterly") return n * 90;
    if (unit === "yearly") return n * 365;
    return n;
  }

  async function handleSubmit() {
    if (!task || !name.trim()) return;
    setLoading(true);
    const member = familyMembers.find(m => m.id === assignedTo);
    const freqDays = freqValue ? toDays(freqValue, freqUnit) : 30;
    
    await base44.entities.Task.update(task.id, {
      name: name.trim(),
      category,
      room: room || undefined,
      frequency_days: freqDays,
      description,
      assigned_to: assignedTo || undefined,
      assigned_to_name: member?.name || undefined,
      start_date: startDate,
    });
    
    setLoading(false);
    onTaskUpdated?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Task Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Clean kitchen" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Category</Label>
            <MobileSelect
              value={category}
              onValueChange={setCategory}
              title="Select Category"
              triggerClassName="mt-1"
              options={["Cleaning","Kitchen Cleaning","Bathroom Cleaning","Bedroom Cleaning","Living Areas","Floors","Deep Cleaning","House Maintenance","Bill Schedules"].map(c => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Room (Optional)</Label>
            <MobileSelect
              value={room}
              onValueChange={setRoom}
              title="Select Room"
              triggerClassName="mt-1"
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
            <Label className="text-xs font-medium text-muted-foreground">Assigned To</Label>
            <MobileSelect
              value={assignedTo}
              onValueChange={setAssignedTo}
              title="Assign To"
              triggerClassName="mt-1"
              options={[
                { value: "", label: "Unassigned" },
                ...familyMembers.map(m => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
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
            {freqValue && <p className="text-xs text-muted-foreground mt-1">{formatFrequency(toDays(freqValue, freqUnit))}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !name.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}