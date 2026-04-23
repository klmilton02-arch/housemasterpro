import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Pencil, Trash2, PlusCircle } from "lucide-react";
import AddTaskDialog from "../components/AddTaskDialog";
import { Input } from "@/components/ui/input";
import MobileSelect from "../components/MobileSelect";
import { Badge } from "@/components/ui/badge";
import { formatFrequency } from "../components/TaskCard";
import EditPresetDialog from "../components/EditPresetDialog";
import { Button } from "@/components/ui/button";

const CLEANING_SUBCATEGORIES = ["Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning", "Living Areas", "Floors", "Deep Cleaning"];

function PresetCard({ p, onEdit, onDelete, onClick, onAddAsTask }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:shadow-md hover:border-primary/30 transition-all group relative">
      <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
        <button onClick={e => onAddAsTask(e, p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium transition-colors" title="Add as Task">
          <PlusCircle className="w-4.5 h-4.5" /><span className="hidden sm:inline">Add</span>
        </button>
        <button onClick={e => onEdit(e, p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition-colors" title="Edit">
          <Pencil className="w-4.5 h-4.5" /><span className="hidden sm:inline">Edit</span>
        </button>
        <button onClick={e => onDelete(e, p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition-colors" title="Delete">
          <Trash2 className="w-4.5 h-4.5" /><span className="hidden sm:inline">Delete</span>
        </button>
      </div>
      <div onClick={() => onClick(p)} className="cursor-pointer">
        <div className="flex items-start gap-2 mb-1.5 pr-36">
          <h3 className="font-heading font-semibold text-sm">{p.name}</h3>
        </div>

      </div>
    </div>
  );
}

export default function Presets() {
  const navigate = useNavigate();

  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("category");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [addTaskPreset, setAddTaskPreset] = useState(null);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);

  function handlePresetClick(preset) {
    setEditingPreset(preset);
    setEditDialogOpen(true);
  }

  function handleEdit(e, preset) {
    e.stopPropagation();
    setEditingPreset(preset);
    setEditDialogOpen(true);
  }

  function handleAddAsTask(e, preset) {
    e.stopPropagation();
    setAddTaskPreset(preset);
    setAddTaskDialogOpen(true);
  }

  async function handleDelete(e, preset) {
    e.stopPropagation();
    if (!confirm(`Delete preset "${preset.name}"?`)) return;
    await base44.entities.PresetTask.delete(preset.id);
    setPresets(prev => prev.filter(p => p.id !== preset.id));
  }

  useEffect(() => {
    base44.entities.PresetTask.list("name", 500).then(p => {
      setPresets(p);
      setLoading(false);
    });
  }, []);

  // For category filter dropdown: cleaning subcategories shown as "Cleaning"
  const displayCategories = [...new Set(presets.map(p =>
    CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category
  ))];

  const displayRooms = [...new Set(presets.map(p => p.room).filter(Boolean))].sort();

  const FREQUENCY_BANDS = [
    { value: "daily", label: "Daily (1-2 days)", min: 1, max: 2 },
    { value: "weekly", label: "Weekly (3-14 days)", min: 3, max: 14 },
    { value: "monthly", label: "Monthly (15-45 days)", min: 15, max: 45 },
    { value: "quarterly", label: "Quarterly (46-120 days)", min: 46, max: 120 },
    { value: "yearly", label: "Yearly (121+ days)", min: 121, max: Infinity },
  ];

  const filtered = presets.filter(p => {
    if (p.category === "Car Maintenance") return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    const displayCat = CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category;
    if (categoryFilter !== "all" && displayCat !== categoryFilter) return false;
    if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
    if (roomFilter !== "all" && p.room !== roomFilter) return false;
    if (frequencyFilter !== "all") {
      const band = FREQUENCY_BANDS.find(b => b.value === frequencyFilter);
      if (band && (p.frequency_days < band.min || p.frequency_days > band.max)) return false;
    }
    return true;
  });

  // Sort filtered results
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "room") return (a.room || "zzz").localeCompare(b.room || "zzz");
    if (sortBy === "frequency") return a.frequency_days - b.frequency_days;
    // default: category
    const catA = CLEANING_SUBCATEGORIES.includes(a.category) ? "Cleaning" : a.category;
    const catB = CLEANING_SUBCATEGORIES.includes(b.category) ? "Cleaning" : b.category;
    return catA.localeCompare(catB) || a.name.localeCompare(b.name);
  });

  // Top-level grouping: cleaning subcategories merged under "Cleaning"
  const grouped = sorted.reduce((acc, p) => {
    let groupKey;
    if (sortBy === "name") groupKey = p.name[0].toUpperCase();
    else if (sortBy === "room") groupKey = p.room || "No Room";
    else if (sortBy === "frequency") {
      const band = FREQUENCY_BANDS.find(b => p.frequency_days >= b.min && p.frequency_days <= b.max);
      groupKey = band ? band.label.split(" (")[0] : "Other";
    } else {
      groupKey = CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category;
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
    <div className="space-y-4 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <h1 className="font-heading text-2xl font-bold">Preset Library</h1>
          <span className="text-sm text-muted-foreground">{presets.length} presets</span>
        </div>
        <Button onClick={() => { setEditingPreset(null); setEditDialogOpen(true); }} className="gap-2 w-full h-11 text-base font-medium bg-blue-400 hover:bg-blue-500 text-white border-0">
          <Plus className="w-5 h-5" /> New Preset
        </Button>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-full h-10 text-base" />
        </div>
        <MobileSelect
          value={sortBy}
          onValueChange={setSortBy}
          title="Sort by"
          triggerClassName="w-full"
          options={[
            { value: "category", label: "Sort by Category" },
            { value: "name", label: "Sort by Name" },
            { value: "room", label: "Sort by Room" },
            { value: "frequency", label: "Sort by Frequency" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <MobileSelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            title="Filter by Category"
            triggerClassName="w-full"
            options={[{ value: "all", label: "All Categories" }, ...displayCategories.map(c => ({ value: c, label: c }))]}
          />
          <MobileSelect
            value={difficultyFilter}
            onValueChange={setDifficultyFilter}
            title="Filter by Difficulty"
            triggerClassName="w-full"
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
            value={roomFilter}
            onValueChange={setRoomFilter}
            title="Filter by Room"
            triggerClassName="w-full"
            options={[{ value: "all", label: "All Rooms" }, ...displayRooms.map(r => ({ value: r, label: r }))]}
          />
          <MobileSelect
            value={frequencyFilter}
            onValueChange={setFrequencyFilter}
            title="Filter by Frequency"
            triggerClassName="w-full"
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
            {sortBy === "category" && groupKey === "Cleaning" ? (
              // Cleaning: show subcategory headers
              Object.entries(
                items.reduce((acc, p) => {
                  if (!acc[p.category]) acc[p.category] = [];
                  acc[p.category].push(p);
                  return acc;
                }, {})
              ).map(([subcat, subItems]) => (
                <div key={subcat} className="mb-5">
                  <h3 className="font-heading font-medium text-xs text-muted-foreground/70 uppercase tracking-wider mb-2 pl-2 border-l-2 border-primary/30">{subcat}</h3>
                  <div className="grid gap-2">
                    {subItems.map(p => (
                      <PresetCard key={p.id} p={p} onEdit={handleEdit} onDelete={handleDelete} onClick={handlePresetClick} onAddAsTask={handleAddAsTask} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid gap-2">
                {items.map(p => (
                  <PresetCard key={p.id} p={p} onEdit={handleEdit} onDelete={handleDelete} onClick={handlePresetClick} onAddAsTask={handleAddAsTask} />
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <AddTaskDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} initialPreset={selectedPreset} />
      <AddTaskDialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen} initialPreset={addTaskPreset} />
      <EditPresetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        preset={editingPreset}
        onSaved={() => base44.entities.PresetTask.list("name", 500).then(setPresets)}
      />
    </div>
  );
}