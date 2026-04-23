import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Sparkles, CheckCircle, BedDouble, Bath, ChefHat, Sofa, UtensilsCrossed, Car, Shirt, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

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
  const navigate = useNavigate();
  const touchStartX = useRef(null);
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff < -60) navigate("/profile"); // swipe right → profile
    else if (diff > 60) navigate("/family"); // swipe left → family
    touchStartX.current = null;
  }

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
    start_date: format(new Date(), "yyyy-MM-dd"),
  });
  const [setupId, setSetupId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(null);

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
          start_date: r.start_date ?? format(new Date(), "yyyy-MM-dd"),
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
    const startDate = config.start_date;

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
      return presets.filter(p => p.room === roomName);
    }

    // Bedrooms
     for (let i = 1; i <= config.bedrooms; i++) {
       const label = config.bedrooms === 1 ? "Bedroom" : `Bedroom ${i}`;
       for (const p of presetsForRoom("Bedroom")) {
         const roomName = config.bedrooms === 1 ? "Bedroom" : `Bedroom ${i}`;
         tasksToCreate.push({ ...p, name: `${label} – ${p.name}`, room: roomName });
       }
     }

     // Full bathrooms
     for (let i = 1; i <= config.full_bathrooms; i++) {
       const label = config.full_bathrooms === 1 ? "Bathroom" : `Bathroom ${i}`;
       for (const p of presetsForRoom("Bathroom")) {
         const roomName = config.full_bathrooms === 1 ? "Bathroom" : `Bathroom ${i}`;
         tasksToCreate.push({ ...p, name: `${label} – ${p.name}`, room: roomName });
       }
     }

     // Half bathrooms
     for (let i = 1; i <= config.half_bathrooms; i++) {
       const label = config.half_bathrooms === 1 ? "Half Bath" : `Half Bath ${i}`;
       const halfPresets = presetsForRoom("Bathroom").filter(
         p => p.task_type !== "Deep Cleaning"
       );
       for (const p of halfPresets) {
         const roomName = config.half_bathrooms === 1 ? "Half Bath" : `Half Bath ${i}`;
         tasksToCreate.push({ ...p, name: `${label} – ${p.name}`, room: roomName });
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
     ];

     for (const room of singleRooms) {
       if (config[room.key]) {
         for (const p of presetsForRoom(room.room)) {
           tasksToCreate.push({ ...p, name: `${room.label} – ${p.name}`, room: room.room });
         }
       }
     }

    // Floors (if any rooms selected)
    const hasRooms = config.bedrooms > 0 || config.has_living_room || config.has_dining_room;
    if (hasRooms) {
      for (const p of presetsForRoom("Whole House")) {
        tasksToCreate.push({ ...p, name: p.name });
      }
    }

    // Create all tasks sequentially to avoid rate limit
     const created = [];
     for (const t of tasksToCreate) {
       const result = await base44.entities.Task.create({
         name: t.name,
         category: t.category,
         room: t.room || null,
         task_type: t.task_type || "Regular",
         frequency_days: t.frequency_days,
         description: t.description || "",
         start_date: startDate,
         next_due_date: startDate,
         status: "Pending",
         overdue_grace_days: 3,
       });
       created.push(result);
       await new Promise(r => setTimeout(r, 300));
     }

    setGenerated(created.length);
    setGenerating(false);
  }

  function NumberInput({ label, icon: Icon, field }) {
    return (
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
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
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
          active ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground"
        }`}
        onClick={() => setConfig(c => ({ ...c, [field]: !c[field] }))}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{label}</span>
        {active && <CheckCircle className="w-3 h-3" />}
      </button>
    );
  }

  return (
    <div className="space-y-3 max-w-xs mx-auto px-1 pt-6" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div>
        <h1 className="font-heading text-2xl font-bold">HomeLifeFocus</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your rooms to auto-generate cleaning tasks</p>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-base">Rooms with multiple instances</h2>
        <NumberInput label="Bedrooms" icon={BedDouble} field="bedrooms" />
        <NumberInput label="Full Bathrooms" icon={Bath} field="full_bathrooms" />
        <NumberInput label="Half Bathrooms" icon={Bath} field="half_bathrooms" />
      </div>

      <div className="space-y-3">
        <Label className="text-sm">Start Date</Label>
        <Input
          type="date"
          value={config.start_date}
          onChange={(e) => setConfig(c => ({ ...c, start_date: e.target.value }))}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
         <h2 className="font-heading font-semibold text-base">Other rooms</h2>
        <div className="grid grid-cols-2 gap-2">
          <ToggleRoom label="Kitchen" icon={ChefHat} field="has_kitchen" />
          <ToggleRoom label="Living Room" icon={Sofa} field="has_living_room" />
          <ToggleRoom label="Dining Room" icon={UtensilsCrossed} field="has_dining_room" />
          <ToggleRoom label="Garage" icon={Car} field="has_garage" />
          <ToggleRoom label="Laundry Room" icon={Shirt} field="has_laundry_room" />
          <ToggleRoom label="Mixed Use" icon={LayoutGrid} field="has_mixed_use" />
        </div>
      </div>

      {generated !== null && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3 text-green-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Successfully generated {generated} tasks!</p>
          </div>
          <Link to="/tasks">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0">View Tasks</Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <Button onClick={generateTasks} disabled={generating} className="w-full gap-2">
          <Sparkles className="w-4 h-4" />
          {generating ? "Generating..." : "Generate Tasks"}
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setConfig({ bedrooms: 2, full_bathrooms: 1, half_bathrooms: 0, has_kitchen: true, has_living_room: true, has_dining_room: false, has_garage: false, has_laundry_room: false, has_mixed_use: false, start_date: format(new Date(), "yyyy-MM-dd") })} className="flex-1 text-xs">
            Reset
          </Button>
          <Button variant="outline" onClick={saveConfig} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Config"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">Generating tasks will add new tasks based on your presets library. Existing tasks won't be removed.</p>
    </div>
  );
}