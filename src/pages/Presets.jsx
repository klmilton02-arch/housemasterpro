import { useState, useEffect } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, ChevronRight, ArrowLeft, Camera } from "lucide-react";
import AddTaskDialog from "../components/AddTaskDialog";
import { Input } from "@/components/ui/input";
import MobileSelect from "../components/MobileSelect";
import { formatFrequency } from "../components/TaskCard";
import EditPresetDialog from "../components/EditPresetDialog";
import { Button } from "@/components/ui/button";
import ScanAppointmentDialog from "../components/ScanAppointmentDialog";


const TASK_TYPE_STYLE = {
  Maintenance: { emoji: "🔧", color: "text-blue-400", bg: "bg-blue-50" },
  Bills:       { emoji: "💰", color: "text-green-500", bg: "bg-green-50" },
  Cleaning:    { emoji: "🫧", color: "text-orange-400", bg: "bg-orange-50" },
  Personal:    { emoji: "⭐", color: "text-purple-400", bg: "bg-purple-50" },
};

function PresetCard({ p, onClick }) {
  const style = TASK_TYPE_STYLE[p.task_type] || {};
  return (
    <button
      onClick={() => onClick(p)}
      className={`w-full border hover:shadow-md rounded-xl px-3 py-2.5 transition-all flex items-center gap-3 text-left active:scale-95 ${style.bg || "bg-card"} border-border/60 hover:border-primary/20`}
    >
      {style.emoji && (
        <span className={`text-lg shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/70`}>{style.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold text-sm truncate text-foreground">{p.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{p.category}{p.task_type ? ` · ${p.task_type}` : ""} · {formatFrequency(p.frequency_days)}</p>
      </div>
      <ChevronRight className={`w-4 h-4 shrink-0 ${style.color || "text-muted-foreground"}`} />
    </button>
  );
}



export default function Presets() {
  const navigate = useNavigate();
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/family", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("room");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [addTaskPreset, setAddTaskPreset] = useState(null);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  function handlePresetClick(preset) {
    setEditingPreset(preset);
    setEditDialogOpen(true);
  }

  function handleAddAsTask(preset) {
    setAddTaskPreset(preset);
    setAddTaskDialogOpen(true);
  }

  useEffect(() => {
    base44.entities.PresetTask.list("name", 500).then(p => {
      setPresets(p);
      setLoading(false);
    });
  }, []);

  const displayRooms = [...new Set(presets.map(p => p.category).filter(Boolean))].sort();

  const FREQUENCY_BANDS = [
    { value: "daily", label: "Daily (1-2 days)", min: 1, max: 2 },
    { value: "weekly", label: "Weekly (3-14 days)", min: 3, max: 14 },
    { value: "monthly", label: "Monthly (15-45 days)", min: 15, max: 45 },
    { value: "quarterly", label: "Quarterly (46-120 days)", min: 46, max: 120 },
    { value: "yearly", label: "Yearly (121+ days)", min: 121, max: Infinity },
  ];

  const filtered = presets.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roomFilter !== "all" && p.category !== roomFilter) return false;
    if (taskTypeFilter !== "all" && p.task_type !== taskTypeFilter) return false;
    if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
    if (frequencyFilter !== "all") {
      const band = FREQUENCY_BANDS.find(b => b.value === frequencyFilter);
      if (band && (p.frequency_days < band.min || p.frequency_days > band.max)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "task_type") return (a.task_type || "").localeCompare(b.task_type || "") || a.name.localeCompare(b.name);
    if (sortBy === "frequency") return a.frequency_days - b.frequency_days;
    // default: room
    return (a.category || "zzz").localeCompare(b.category || "zzz") || a.name.localeCompare(b.name);
  });

  const grouped = sorted.reduce((acc, p) => {
    let groupKey;
    if (sortBy === "name") groupKey = p.name[0].toUpperCase();
    else if (sortBy === "task_type") groupKey = p.task_type || "Uncategorized";
    else if (sortBy === "frequency") {
      const band = FREQUENCY_BANDS.find(b => p.frequency_days >= b.min && p.frequency_days <= b.max);
      groupKey = band ? band.label.split(" (")[0] : "Other";
    } else {
      groupKey = p.category || "No Room";
    }
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      <h1 className="font-heading text-3xl font-bold">Presets</h1>

      <Button onClick={() => setScanDialogOpen(true)} className="w-full gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600">
        <Camera className="w-4 h-4" />
        Scan Appointment
      </Button>

      <button onClick={() => navigate("/tasks")} className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-md hover:border-blue-200 transition-all text-left active:scale-95">
        <ArrowLeft className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground">Back to Tasks</span>
      </button>

      <div className="space-y-3">
        <div className="col-span-2">
          <Button onClick={() => { setEditingPreset(null); setEditDialogOpen(true); }} className="gap-2 w-full font-medium bg-violet-200 hover:bg-violet-300 text-violet-900">
            <Plus className="w-5 h-5" /> New Preset
          </Button>
        </div>
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search presets..." className="pl-9 w-full h-12" />
        </div>
        <div>
          <MobileSelect
            value={sortBy}
            onValueChange={setSortBy}
            title="Sort by"
            triggerClassName="w-full h-12"
            options={[
              { value: "room", label: "Sort by Room" },
              { value: "task_type", label: "Sort by Type" },
              { value: "name", label: "Sort by Name" },
              { value: "frequency", label: "Sort by Frequency" },
            ]}
          />
        </div>
        <div className="overflow-y-auto max-h-64">
          <div className="grid grid-cols-2 gap-3 pr-2">
            <MobileSelect
              value={roomFilter}
              onValueChange={setRoomFilter}
              title="Filter by Room"
              triggerClassName="w-full h-12"
              options={[{ value: "all", label: "All Rooms" }, ...displayRooms.map(r => ({ value: r, label: r }))]}
            />
            <MobileSelect
              value={taskTypeFilter}
              onValueChange={setTaskTypeFilter}
              title="Filter by Type"
              triggerClassName="w-full h-12"
              options={[
                { value: "all", label: "All Types" },
                { value: "Cleaning", label: "Cleaning" },
                { value: "Maintenance", label: "Maintenance" },
                { value: "Bills", label: "Bills" },
                { value: "Personal", label: "Personal" },
              ]}
            />
            <MobileSelect
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
              title="Filter by Difficulty"
              triggerClassName="w-full h-12"
              options={[
                { value: "all", label: "All Difficulties" },
                { value: "Trivial", label: "Trivial" },
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
                { value: "Very Hard", label: "Very Hard" },
              ]}
            />
            <MobileSelect
              value={frequencyFilter}
              onValueChange={setFrequencyFilter}
              title="Filter by Frequency"
              triggerClassName="w-full h-12"
              options={[
                { value: "all", label: "All Frequencies" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
          </div>
        </div>
        {(roomFilter !== "all" || taskTypeFilter !== "all" || difficultyFilter !== "all" || frequencyFilter !== "all") && (
          <Button
            variant="outline"
            onClick={() => { setRoomFilter("all"); setTaskTypeFilter("all"); setDifficultyFilter("all"); setFrequencyFilter("all"); }}
            className="w-full text-sm"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{filtered.length} of {presets.length} presets</span>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No presets match your search.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([groupKey, items]) => (
          <div key={groupKey}>
            <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
              {groupKey}
            </h2>
            <div className="grid gap-2">
              {items.map(p => (
                <PresetCard key={p.id} p={p} onClick={handlePresetClick} />
              ))}
            </div>
          </div>
        ))
      )}

      <AddTaskDialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen} initialPreset={addTaskPreset} />
      <EditPresetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        preset={editingPreset}
        onSaved={() => base44.entities.PresetTask.list("name", 500).then(setPresets)}
        onDeleted={id => setPresets(prev => prev.filter(p => p.id !== id))}
      />
      <ScanAppointmentDialog open={scanDialogOpen} onOpenChange={setScanDialogOpen} onTaskCreated={() => base44.entities.PresetTask.list("name", 500).then(setPresets)} />
    </div>
  );
}