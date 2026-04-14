import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Search, Plus, Pencil, Trash2 } from "lucide-react";
import AddTaskDialog from "../components/AddTaskDialog";
import { Input } from "@/components/ui/input";
import MobileSelect from "../components/MobileSelect";
import { Badge } from "@/components/ui/badge";
import { formatFrequency } from "../components/TaskCard";
import EditPresetDialog from "../components/EditPresetDialog";
import { Button } from "@/components/ui/button";

const CLEANING_SUBCATEGORIES = ["Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning", "Living Areas", "Floors", "Deep Cleaning"];

function PresetCard({ p, onEdit, onDelete, onClick }) {
  return (
    <div className="bg-card border border-border rounded-lg p-2 hover:shadow-md hover:border-primary/30 transition-all group relative">
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={e => onEdit(e, p)} className="w-11 h-11 flex items-center justify-center rounded hover:bg-muted"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
        <button onClick={e => onDelete(e, p)} className="w-11 h-11 flex items-center justify-center rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
      </div>
      <div onClick={() => onClick(p)} className="cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-1 pr-10">
          <h3 className="font-heading font-semibold text-xs">{p.name}</h3>
          {p.difficulty && (
            <Badge variant="outline" className="shrink-0 text-xs">{p.difficulty}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {formatFrequency(p.frequency_days)}
          </span>
          {p.room && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {p.room}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Presets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  function handlePresetClick(preset) {
    setSelectedPreset(preset);
    setAddDialogOpen(true);
  }

  function handleEdit(e, preset) {
    e.stopPropagation();
    setEditingPreset(preset);
    setEditDialogOpen(true);
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

  const filtered = presets.filter(p => {
    if (p.category === "Car Maintenance") return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    const displayCat = CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category;
    if (categoryFilter !== "all" && displayCat !== categoryFilter) return false;
    if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
    return true;
  });

  // Top-level grouping: cleaning subcategories merged under "Cleaning"
  const grouped = filtered.reduce((acc, p) => {
    const displayCat = CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category;
    if (!acc[displayCat]) acc[displayCat] = [];
    acc[displayCat].push(p);
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
    <div className="space-y-3 max-w-xs md:max-w-2xl mx-auto px-2 sm:px-1 pt-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading text-3xl sm:text-2xl font-bold">Preset Library</h1>
          <p className="text-base sm:text-sm text-muted-foreground mt-1">{presets.length} presets</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => { setEditingPreset(null); setEditDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Preset
          </Button>
          <p className="text-base sm:text-sm text-muted-foreground">{presets.length} presets</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-7" />
        </div>
        <MobileSelect
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          title="Filter by Category"
          triggerClassName="flex-1"
          options={[{ value: "all", label: "All Categories" }, ...displayCategories.map(c => ({ value: c, label: c }))]}
        />
        <MobileSelect
          value={difficultyFilter}
          onValueChange={setDifficultyFilter}
          title="Filter by Difficulty"
          triggerClassName="flex-1"
          options={[
            { value: "all", label: "All Difficulties" },
            { value: "Trivial", label: "Trivial" },
            { value: "Easy", label: "Easy" },
            { value: "Medium", label: "Medium" },
            { value: "Hard", label: "Hard" },
            { value: "Very Hard", label: "Very Hard" },
          ]}
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">No presets match your search.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">{cat}</h2>
            {cat === "Cleaning" ? (
              // Cleaning: show subcategory headers
              Object.entries(
                items.reduce((acc, p) => {
                  if (!acc[p.category]) acc[p.category] = [];
                  acc[p.category].push(p);
                  return acc;
                }, {})
              ).map(([subcat, subItems]) => (
                <div key={subcat} className="mb-5">
                  <h3 className="font-heading font-medium text-xs text-muted-foreground/70 uppercase tracking-wider mb-1 pl-1.5 border-l-2 border-primary/30">{subcat}</h3>
                  <div className="grid gap-1.5">
                    {subItems.map(p => (
                      <PresetCard key={p.id} p={p} onEdit={handleEdit} onDelete={handleDelete} onClick={handlePresetClick} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid gap-1.5">
                {items.map(p => (
                  <PresetCard key={p.id} p={p} onEdit={handleEdit} onDelete={handleDelete} onClick={handlePresetClick} />
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <AddTaskDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} initialPreset={selectedPreset} />
      <EditPresetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        preset={editingPreset}
        onSaved={() => base44.entities.PresetTask.list("name", 500).then(setPresets)}
      />
    </div>
  );
}