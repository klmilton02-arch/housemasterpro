import { useState, useEffect } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, ChevronRight } from "lucide-react";
import AddTaskDialog from "../components/AddTaskDialog";
import { Input } from "@/components/ui/input";
import MobileSelect from "../components/MobileSelect";
import { formatFrequency } from "../components/TaskCard";
import EditPresetDialog from "../components/EditPresetDialog";
import { Button } from "@/components/ui/button";


const TASK_TYPE_STYLE = {
  Maintenance: { emoji: "🔧", color: "text-blue-600" },
  Bills:       { emoji: "💰", color: "text-green-600" },
  Cleaning:    { emoji: "🫧", color: "text-orange-500" },
};

function PresetCard({ p, onClick }) {
  const style = TASK_TYPE_STYLE[p.task_type] || {};
  return (
    <button
      onClick={() => onClick(p)}
      className="w-full bg-blue-400 hover:bg-blue-500 border-0 rounded-lg px-3 transition-all flex items-center gap-3 text-left h-14"
    >
      {style.emoji && (
        <span className="text-lg shrink-0">{style.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold text-sm truncate text-white">{p.name}</h3>
        <p className="text-xs text-white/70 mt-0.5">{p.category}{p.task_type ? ` · ${p.task_type}` : ""} · {formatFrequency(p.frequency_days)}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
    </button>
  );
}



export default function Presets() {
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
    <div className="space-y-4 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Preset Library</h1>
          <span className="text-sm text-muted-foreground">{presets.length} presets</span>
        </div>
        <Button onClick={() => { setEditingPreset(null); setEditDialogOpen(true); }} className="gap-2 w-full h-14 text-base font-medium bg-blue-400 hover:bg-blue-500 text-white border-0">
          <Plus className="w-5 h-5" /> New Preset
        </Button>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-full h-14 text-base" />
        </div>
        <MobileSelect
          value={sortBy}
          onValueChange={setSortBy}
          title="Sort by"
          triggerClassName="w-full h-14"
          options={[
            { value: "room", label: "Sort by Room" },
            { value: "task_type", label: "Sort by Type" },
            { value: "name", label: "Sort by Name" },
            { value: "frequency", label: "Sort by Frequency" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <MobileSelect
            value={roomFilter}
            onValueChange={setRoomFilter}
            title="Filter by Room"
            triggerClassName="w-full h-14"
            options={[{ value: "all", label: "All Rooms" }, ...displayRooms.map(r => ({ value: r, label: r }))]}
          />
          <MobileSelect
            value={taskTypeFilter}
            onValueChange={setTaskTypeFilter}
            title="Filter by Type"
            triggerClassName="w-full h-14"
            options={[
              { value: "all", label: "All Types" },
              { value: "Cleaning", label: "Cleaning" },
              { value: "Maintenance", label: "Maintenance" },
              { value: "Bills", label: "Bills" },
            ]}
          />
          <MobileSelect
            value={difficultyFilter}
            onValueChange={setDifficultyFilter}
            title="Filter by Difficulty"
            triggerClassName="w-full h-14"
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
            triggerClassName="w-full h-14"
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

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">No presets match your search.</p>
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
    </div>
  );
}