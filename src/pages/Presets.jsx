import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Search, Plus, Pencil, Trash2 } from "lucide-react";
import AddTaskDialog from "../components/AddTaskDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatFrequency } from "../components/TaskCard";
import EditPresetDialog from "../components/EditPresetDialog";
import { Button } from "@/components/ui/button";

const CLEANING_SUBCATEGORIES = ["Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning", "Living Areas", "Floors", "Deep Cleaning"];

function PresetCard({ p, onEdit, onDelete, onClick }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group relative">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={e => onEdit(e, p)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <button onClick={e => onDelete(e, p)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
      </div>
      <div onClick={() => onClick(p)} className="cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2 pr-14">
          <h3 className="font-heading font-semibold text-sm">{p.name}</h3>
          <Badge variant={p.task_type === "Deep Cleaning" ? "secondary" : "outline"} className="shrink-0 text-xs">
            {p.task_type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {formatFrequency(p.frequency_days)}
          </span>
          {p.floor_type_note && (
            <span className="text-xs text-muted-foreground italic">{p.floor_type_note}</span>
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
  const [typeFilter, setTypeFilter] = useState("all");
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
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    const displayCat = CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category;
    if (categoryFilter !== "all" && displayCat !== categoryFilter) return false;
    if (typeFilter !== "all" && p.task_type !== typeFilter) return false;
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> Preset Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Browse {presets.length} preset tasks with recommended frequencies</p>
        </div>
        <Button onClick={() => { setEditingPreset(null); setEditDialogOpen(true); }} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Preset
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search presets..." className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {displayCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Regular">Regular</SelectItem>
            <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No presets match your search.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
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
                  <h3 className="font-heading font-medium text-xs text-muted-foreground/70 uppercase tracking-wider mb-2 pl-2 border-l-2 border-primary/30">{subcat}</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {subItems.map(p => (
                      <PresetCard key={p.id} p={p} onEdit={handleEdit} onDelete={handleDelete} onClick={handlePresetClick} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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