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
  const [bathroomModalOpen, setBathroomModalOpen] = useState(false);
  const [halfBathroomModalOpen, setHalfBathroomModalOpen] = useState(false);
  const [kitchenModalOpen, setKitchenModalOpen] = useState(false);

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
      const family_group_id = me?.family_group_id ?? null;

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





  return (
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <h1 className="font-heading text-3xl font-bold md:hidden">Home Setup</h1>

      {/* Quick stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left column - bedrooms and bathrooms */}
        <div className="space-y-3">
          <button onClick={() => setBedroomModalOpen(true)} className="h-22 w-full">
            <StatCard icon={BedDouble} label={config.bedrooms === 1 ? "Bedroom" : "Bedrooms"} value={config.bedrooms} color="bg-blue-100 text-blue-600" labelRight smallLabel />
          </button>
          <button onClick={() => setBathroomModalOpen(true)} className="h-22 w-full">
            <StatCard icon={Bath} label="Full Bathrooms" value={config.full_bathrooms} color="bg-purple-100 text-purple-600" labelRight smallLabel />
          </button>
          <button onClick={() => setHalfBathroomModalOpen(true)} className="h-22 w-full">
            <StatCard icon={Bath} label="Half Bathrooms" value={config.half_bathrooms} color="bg-pink-100 text-pink-600" labelRight smallLabel />
          </button>
        </div>
        
        {/* Right column - other rooms */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
          <button onClick={() => setConfig(c => ({ ...c, has_kitchen: !c.has_kitchen }))} className="h-22">
            <StatCard icon={ChefHat} label="Kitchen" value={config.has_kitchen ? "✓" : "○"} color={config.has_kitchen ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_living_room: !c.has_living_room }))} className="h-22">
            <StatCard icon={Sofa} label="Living Room" value={config.has_living_room ? "✓" : "○"} color={config.has_living_room ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_dining_room: !c.has_dining_room }))} className="h-22">
            <StatCard icon={UtensilsCrossed} label="Dining Room" value={config.has_dining_room ? "✓" : "○"} color={config.has_dining_room ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_garage: !c.has_garage }))} className="h-22">
            <StatCard icon={Car} label="Garage" value={config.has_garage ? "✓" : "○"} color={config.has_garage ? "bg-yellow-100 text-yellow-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_laundry_room: !c.has_laundry_room }))} className="h-22">
            <StatCard icon={Shirt} label="Laundry" value={config.has_laundry_room ? "✓" : "○"} color={config.has_laundry_room ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_mixed_use: !c.has_mixed_use }))} className="h-22">
            <StatCard icon={LayoutGrid} label="Mixed Use" value={config.has_mixed_use ? "✓" : "○"} color={config.has_mixed_use ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_office: !c.has_office }))} className="h-22">
            <StatCard icon={Monitor} label="Office" value={config.has_office ? "✓" : "○"} color={config.has_office ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-600"} />
          </button>
          <button onClick={() => setConfig(c => ({ ...c, has_whole_house: !c.has_whole_house }))} className="h-22">
            <StatCard icon={Wind} label="Whole House" value={config.has_whole_house ? "✓" : "○"} color={config.has_whole_house ? "bg-lime-100 text-lime-600" : "bg-slate-100 text-slate-600"} />
          </button>
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

      {/* Full Bathroom Modal */}
      <Dialog open={bathroomModalOpen} onOpenChange={setBathroomModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configure Full Bathrooms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 bg-muted border border-border rounded-lg h-12">
              <span className="font-medium text-base">Number of Full Bathrooms</span>
              <div className="flex items-center gap-2">
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, full_bathrooms: Math.max(0, c.full_bathrooms - 1) }))}
                >−</button>
                <span className="w-4 text-center font-semibold text-xs">{config.full_bathrooms}</span>
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, full_bathrooms: c.full_bathrooms + 1 }))}
                >+</button>
              </div>
            </div>
            {config.full_bathrooms > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Bathroom Names</label>
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
                    className="h-9 text-sm"
                  />
                ))}
              </div>
            )}
            <Button onClick={() => setBathroomModalOpen(false)} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kitchen Modal */}
      <Dialog open={kitchenModalOpen} onOpenChange={setKitchenModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kitchen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-base">Include Kitchen</span>
              <button
                onClick={() => setConfig(c => ({ ...c, has_kitchen: !c.has_kitchen }))}
                className={`px-4 py-2 rounded-lg border transition-all ${config.has_kitchen ? "bg-orange-100 text-orange-600 border-orange-300" : "bg-muted border-border"}`}
              >
                {config.has_kitchen ? "Yes" : "No"}
              </button>
            </div>
            <Button onClick={() => setKitchenModalOpen(false)} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Half Bathroom Modal */}
      <Dialog open={halfBathroomModalOpen} onOpenChange={setHalfBathroomModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configure Half Bathrooms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 bg-muted border border-border rounded-lg h-12">
              <span className="font-medium text-base">Number of Half Bathrooms</span>
              <div className="flex items-center gap-2">
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, half_bathrooms: Math.max(0, c.half_bathrooms - 1) }))}
                >−</button>
                <span className="w-4 text-center font-semibold text-xs">{config.half_bathrooms}</span>
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, half_bathrooms: c.half_bathrooms + 1 }))}
                >+</button>
              </div>
            </div>
            {config.half_bathrooms > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Half Bathroom Names</label>
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
                    className="h-9 text-sm"
                  />
                ))}
              </div>
            )}
            <Button onClick={() => setHalfBathroomModalOpen(false)} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bedroom Modal */}
      <Dialog open={bedroomModalOpen} onOpenChange={setBedroomModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configure Bedrooms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 bg-muted border border-border rounded-lg h-12">
              <span className="font-medium text-base">Number of Bedrooms</span>
              <div className="flex items-center gap-2">
                <button
                  className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  onClick={() => setConfig(c => ({ ...c, bedrooms: Math.max(0, c.bedrooms - 1) }))}
                >−</button>
                <span className="w-4 text-center font-semibold text-xs">{config.bedrooms}</span>
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