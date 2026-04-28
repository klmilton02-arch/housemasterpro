import { useState, useEffect } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, CheckCircle, BedDouble, Bath, ChefHat, Sofa, UtensilsCrossed, Car, Shirt, LayoutGrid, Monitor, Wind, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import StatCard from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ROOM_CATEGORY_MAP = {
  bedroom: "Bedroom Cleaning",
  bathroom: "Bathroom Cleaning",
  kitchen: "Kitchen Cleaning",
  living_room: "Living Areas",
  dining_room: "Living Areas",
  garage: "Car Maintenance",
  laundry: "House Maintenance",
  floors: "Floors",
};

export default function HomeSetup() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/family", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [config, setConfig] = useState({
    bedrooms: 2,
    full_bathrooms: 1,
    half_bathrooms: 0,
    has_kitchen: true,
    has_living_room: true,
    has_dining_room: false,
    has_garage: false,
    has_laundry_room: false,
    has_mixed_use: false,
    has_office: false,
    has_whole_house: false,
    start_date_cleaning: format(new Date(), "yyyy-MM-dd"),
    start_date_maintenance: format(new Date(), "yyyy-MM-dd"),
  });
  const [useStartDateCleaning, setUseStartDateCleaning] = useState(true);
  const [useStartDateMaintenance, setUseStartDateMaintenance] = useState(true);
  const [bedroomNames, setBedroomNames] = useState([]);
  const [bathroomNames, setBathroomNames] = useState([]);
  const [halfBathroomNames, setHalfBathroomNames] = useState([]);
  const [setupId, setSetupId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [bedroomModalOpen, setBedroomModalOpen] = useState(false);

  useEffect(() => {
    base44.entities.HomeSetup.list().then(records => {
      if (records.length > 0) {
        const r = records[0];
        setSetupId(r.id);
        setConfig({
          bedrooms: r.bedrooms ?? 2,
          full_bathrooms: r.full_bathrooms ?? 1,
          half_bathrooms: r.half_bathrooms ?? 0,
          has_kitchen: r.has_kitchen ?? true,
          has_living_room: r.has_living_room ?? true,
          has_dining_room: r.has_dining_room ?? false,
          has_garage: r.has_garage ?? false,
          has_laundry_room: r.has_laundry_room ?? false,
          has_mixed_use: r.has_mixed_use ?? false,
          has_office: r.has_office ?? false,
          has_whole_house: r.has_whole_house ?? false,
          start_date_cleaning: r.start_date_cleaning ?? format(new Date(), "yyyy-MM-dd"),
          start_date_maintenance: r.start_date_maintenance ?? format(new Date(), "yyyy-MM-dd"),
        });
      }
    });
  }, []);

  async function saveConfig() {
    setSaving(true);
    if (setupId) {
      await base44.entities.HomeSetup.update(setupId, config);
    } else {
      const record = await base44.entities.HomeSetup.create(config);
      setSetupId(record.id);
    }
    setSaving(false);
  }

  async function generateTasks() {
    setGenerating(true);
    try {
      const me = await base44.auth.me();
      const family_group_id = me?.family_group_id || null;

      // Save config first
      if (setupId) {
        await base44.entities.HomeSetup.update(setupId, config);
      } else {
        const record = await base44.entities.HomeSetup.create(config);
        setSetupId(record.id);
      }

      const presets = await base44.entities.PresetTask.list();
      const tasksToCreate = [];

      function presetsForRoom(roomName) {
        return presets.filter(p => p.category === roomName);
      }

      // Bedrooms
      for (let i = 1; i <= config.bedrooms; i++) {
        const defaultName = config.bedrooms === 1 ? "Bedroom" : `Bedroom ${i}`;
        const label = bedroomNames[i - 1]?.trim() || defaultName;
        for (const p of presetsForRoom("Bedroom") || []) {
          tasksToCreate.push({ ...p, name: `${label} – ${p.name}`, room: label });
        }
      }

      // Full bathrooms
      for (let i = 1; i <= config.full_bathrooms; i++) {
        const defaultName = config.full_bathrooms === 1 ? "Bathroom" : `Bathroom ${i}`;
        const label = bathroomNames[i - 1]?.trim() || defaultName;
        for (const p of presetsForRoom("Full Bathroom")) {
          tasksToCreate.push({ ...p, name: `${label} – ${p.name}`, room: label });
        }
      }

      // Half bathrooms
      for (let i = 1; i <= config.half_bathrooms; i++) {
        const defaultName = config.half_bathrooms === 1 ? "Half Bath" : `Half Bath ${i}`;
        const label = halfBathroomNames[i - 1]?.trim() || defaultName;
        const halfPresets = presetsForRoom("Half Bathroom").filter(
          p => p.task_type !== "Deep Cleaning"
        );
        for (const p of halfPresets) {
          tasksToCreate.push({ ...p, name: `${label} – ${p.name}`, room: label });
        }
      }

       // Single-instance rooms
       const singleRooms = [
         { key: "has_kitchen", label: "Kitchen", room: "Kitchen" },
         { key: "has_living_room", label: "Living Room", room: "Living Room" },
         { key: "has_dining_room", label: "Dining Room", room: "Dining Room" },
         { key: "has_garage", label: "Garage", room: "Garage" },
         { key: "has_laundry_room", label: "Laundry Room", room: "Laundry Room" },
         { key: "has_mixed_use", label: "Mixed Use Room", room: "Mixed Use Room" },
         { key: "has_office", label: "Office", room: "Office" },
       ];

       for (const room of singleRooms) {
         if (config[room.key]) {
           for (const p of presetsForRoom(room.room)) {
             tasksToCreate.push({ ...p, name: `${room.label} – ${p.name}`, room: room.room });
           }
         }
       }

      // Whole House tasks (if any rooms selected)
      const hasRooms = config.bedrooms > 0 || config.has_living_room || config.has_dining_room;
      if (hasRooms) {
        for (const p of presetsForRoom("Whole House")) {
          tasksToCreate.push({ ...p, name: p.name });
        }
      }

      // Create all tasks using bulkCreate to avoid rate limit
      const taskData = tasksToCreate.map(t => {
        const isCleaning = t.task_type === "Cleaning";
        const hasStartDate = isCleaning ? useStartDateCleaning : useStartDateMaintenance;
        const startDate = hasStartDate ? (isCleaning ? config.start_date_cleaning : config.start_date_maintenance) : null;
        let nextDueDate;
        if (startDate) {
          nextDueDate = startDate;
        } else {
          // Spread out by frequency_days to avoid inundating on day 1
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + t.frequency_days);
          nextDueDate = format(dueDate, "yyyy-MM-dd");
        }
        return {
          name: t.name,
          category: t.task_type,
          room: t.room || null,
          frequency_days: t.frequency_days,
          description: t.description || "",
          start_date: startDate,
          next_due_date: nextDueDate,
          status: "Pending",
          overdue_grace_days: 3,
          family_group_id,
        };
      });

      if (taskData.length === 0) {
        alert("No tasks to generate. Make sure you have presets and rooms configured.");
        setGenerating(false);
        return;
      }

      const created = await base44.entities.Task.bulkCreate(taskData);
      setGenerated(created.length);
    } catch (error) {
      alert(`Error generating tasks: ${error.message}`);
      console.error("Generate tasks error:", error);
    } finally {
      setGenerating(false);
    }
  }

  function NumberInput({ label, icon: Icon, field }) {
    return (
      <div className="flex items-center justify-between px-4 bg-card border border-border rounded-xl h-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-lg"
            onClick={() => setConfig(c => ({ ...c, [field]: Math.max(0, (c[field] || 0) - 1) }))}
          >−</button>
          <span className="w-6 text-center font-semibold">{config[field] || 0}</span>
          <button
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-lg"
            onClick={() => setConfig(c => ({ ...c, [field]: (c[field] || 0) + 1 }))}
          >+</button>
        </div>
      </div>
    );
  }

  function ToggleRoom({ label, icon: Icon, field }) {
    const active = config[field];
    return (
      <button
        className={`flex items-center gap-2 p-3 rounded-xl border transition-all h-24 ${
          active ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground"
        }`}
        onClick={() => setConfig(c => ({ ...c, [field]: !c[field] }))}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Icon className="w-6 h-6" />
          {active && <CheckCircle className="w-4 h-4" />}
        </div>
        <span className="text-base font-medium text-left">{label}</span>
      </button>
    );
  }

  return (
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <h1 className="font-heading text-3xl font-bold md:hidden">Home Setup</h1>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button onClick={() => setBedroomModalOpen(true)} className="h-22">
          <StatCard icon={BedDouble} label="Bedrooms" value={config.bedrooms} color="bg-blue-100 text-blue-600" />
        </button>
        <StatCard icon={Bath} label="Bathrooms" value={config.full_bathrooms + config.half_bathrooms} color="bg-purple-100 text-purple-600" className="h-22" />
        <div className="col-span-2 h-22">
          <StatCard icon={Sparkles} label="Generate your tasks" value={generated !== null ? `${generated} created` : "Start"} color={generated !== null ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"} />
        </div>
      </div>

      {/* Date pickers */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useStartDateCleaning}
              onChange={(e) => setUseStartDateCleaning(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Set Start Date - Cleaning Tasks</span>
          </label>
          {useStartDateCleaning && (
            <Input
              type="date"
              value={config.start_date_cleaning}
              onChange={(e) => setConfig(c => ({ ...c, start_date_cleaning: e.target.value }))}
              className="w-full mt-2"
            />
          )}
        </div>
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useStartDateMaintenance}
              onChange={(e) => setUseStartDateMaintenance(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Set Start Date - Maintenance Tasks</span>
          </label>
          {useStartDateMaintenance && (
            <Input
              type="date"
              value={config.start_date_maintenance}
              onChange={(e) => setConfig(c => ({ ...c, start_date_maintenance: e.target.value }))}
              className="w-full mt-2"
            />
          )}
        </div>
      </div>



      {/* Bathrooms */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2">
          <Bath className="w-4 h-4" /> Bathrooms
        </h2>
        <div className="space-y-3">
          <NumberInput label="Full Bathrooms" icon={Bath} field="full_bathrooms" />
          {config.full_bathrooms > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              {Array.from({ length: config.full_bathrooms }, (_, i) => (
                <Input
                  key={i}
                  placeholder={config.full_bathrooms === 1 ? "Bathroom" : `Bathroom ${i + 1}`}
                  value={bathroomNames[i] || ""}
                  onChange={e => {
                    const updated = [...bathroomNames];
                    updated[i] = e.target.value;
                    setBathroomNames(updated);
                  }}
                  className="h-10 text-sm"
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3 pt-3 border-t border-border">
          <NumberInput label="Half Bathrooms" icon={Bath} field="half_bathrooms" />
          {config.half_bathrooms > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              {Array.from({ length: config.half_bathrooms }, (_, i) => (
                <Input
                  key={i}
                  placeholder={config.half_bathrooms === 1 ? "Half Bath" : `Half Bath ${i + 1}`}
                  value={halfBathroomNames[i] || ""}
                  onChange={e => {
                    const updated = [...halfBathroomNames];
                    updated[i] = e.target.value;
                    setHalfBathroomNames(updated);
                  }}
                  className="h-10 text-sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Other rooms */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="font-heading font-semibold text-base">Other Rooms</h2>
        <div className="grid grid-cols-2 gap-2">
           <ToggleRoom label="Kitchen" icon={ChefHat} field="has_kitchen" />
           <ToggleRoom label="Living Room" icon={Sofa} field="has_living_room" />
           <ToggleRoom label="Dining Room" icon={UtensilsCrossed} field="has_dining_room" />
           <ToggleRoom label="Garage" icon={Car} field="has_garage" />
           <ToggleRoom label="Laundry Room" icon={Shirt} field="has_laundry_room" />
           <ToggleRoom label="Mixed Use" icon={LayoutGrid} field="has_mixed_use" />
           <ToggleRoom label="Office" icon={Monitor} field="has_office" />
           <ToggleRoom label="Whole House" icon={Wind} field="has_whole_house" />
         </div>
      </div>

      {/* Success message */}
      {generated !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-3 text-green-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Successfully generated {generated} tasks!</p>
          </div>
          <Link to="/tasks">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0">View Tasks</Button>
          </Link>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
         <Button onClick={generateTasks} disabled={generating} className="w-full gap-2 h-12 text-base font-medium bg-blue-400 hover:bg-blue-500">
          <Sparkles className="w-4 h-4" />
          {generating ? "Generating..." : "Generate Tasks"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfig({ bedrooms: 2, full_bathrooms: 1, half_bathrooms: 0, has_kitchen: true, has_living_room: true, has_dining_room: false, has_garage: false, has_laundry_room: false, has_mixed_use: false, has_office: false, has_whole_house: false, start_date_cleaning: format(new Date(), "yyyy-MM-dd"), start_date_maintenance: format(new Date(), "yyyy-MM-dd") })} className="flex-1 h-12 text-sm">
            Reset
          </Button>
          <Button variant="outline" onClick={saveConfig} disabled={saving} className="flex-1 h-12 text-sm">
            {saving ? "Saving..." : "Save Config"}
          </Button>
        </div>
      </div>

      {/* Bedroom Modal */}
      <Dialog open={bedroomModalOpen} onOpenChange={setBedroomModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configure Bedrooms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 bg-muted border border-border rounded-lg h-12">
              <span className="font-medium text-sm">Number of Bedrooms</span>
              <div className="flex items-center gap-2">
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, bedrooms: Math.max(0, c.bedrooms - 1) }))}
                >−</button>
                <span className="w-4 text-center font-semibold">{config.bedrooms}</span>
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, bedrooms: c.bedrooms + 1 }))}
                >+</button>
              </div>
            </div>
            {config.bedrooms > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Bedroom Names</label>
                {Array.from({ length: config.bedrooms }, (_, i) => (
                  <Input
                    key={i}
                    placeholder={config.bedrooms === 1 ? "Bedroom" : `Bedroom ${i + 1}`}
                    value={bedroomNames[i] || ""}
                    onChange={e => {
                      const updated = [...bedroomNames];
                      updated[i] = e.target.value;
                      setBedroomNames(updated);
                    }}
                    className="h-9 text-sm"
                  />
                ))}
              </div>
            )}
            <Button onClick={() => setBedroomModalOpen(false)} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}