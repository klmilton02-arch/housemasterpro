import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Search, PlusCircle, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import MobileSelect from "./MobileSelect";
import { formatFrequency } from "./TaskCard";
import AddTaskDialog from "./AddTaskDialog";

const CLEANING_SUBCATEGORIES = ["Kitchen Cleaning", "Bathroom Cleaning", "Bedroom Cleaning", "Living Areas", "Floors", "Deep Cleaning"];

const FREQUENCY_BANDS = [
  { value: "daily", label: "Daily", min: 1, max: 2 },
  { value: "weekly", label: "Weekly", min: 3, max: 14 },
  { value: "monthly", label: "Monthly", min: 15, max: 45 },
  { value: "quarterly", label: "Quarterly", min: 46, max: 120 },
  { value: "yearly", label: "Yearly", min: 121, max: Infinity },
];

const DIFFICULTY_ORDER = ["Trivial", "Easy", "Medium", "Hard", "Very Hard"];

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

function TableHeader({ sortBy, sortDir, onSort }) {
  const cols = [
    { key: "name", label: "Task Name" },
    { key: "category", label: "Category" },
    { key: "room", label: "Room" },
    { key: "frequency", label: "Frequency" },
    { key: "difficulty", label: "Difficulty" },
    { key: "description", label: "Description" },
  ];
  return (
    <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_2fr_auto] gap-2 px-2 py-1.5 bg-muted/50 rounded-md">
      {cols.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors text-left"
        >
          {label}
          <SortIcon col={key} sortBy={sortBy} sortDir={sortDir} />
        </button>
      ))}
      <span />
    </div>
  );
}

function PresetRow({ p, onAdd }) {
  return (
    <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_2fr_auto] gap-2 items-center px-2 py-2 border-b border-border last:border-0 text-sm">
      <span className="font-medium text-foreground truncate">{p.name}</span>
      <span className="text-muted-foreground truncate">{CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category}</span>
      <span className="text-muted-foreground truncate">{p.room || "—"}</span>
      <span className="text-primary font-medium truncate">{formatFrequency(p.frequency_days)}</span>
      <span className="text-muted-foreground truncate">{p.difficulty || "—"}</span>
      <span className="text-muted-foreground text-xs truncate">{p.description || "—"}</span>
      <button
        onClick={() => onAdd(p)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-500 transition-colors"
        title="Add as Task"
      >
        <PlusCircle className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function DashboardPresetBrowser({ onTaskAdded }) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("category");
  const [sortDir, setSortDir] = useState("asc");
  const [addTaskPreset, setAddTaskPreset] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (open && !loaded) {
      base44.entities.PresetTask.list("name", 500).then(p => {
        setPresets(p.filter(x => x.category !== "Car Maintenance"));
        setLoaded(true);
      });
    }
  }, [open, loaded]);

  function handleAdd(preset) {
    setAddTaskPreset(preset);
    setAddDialogOpen(true);
  }

  const displayCategories = [...new Set(presets.map(p =>
    CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category
  ))];
  const displayRooms = [...new Set(presets.map(p => p.room).filter(Boolean))].sort();

  const filtered = presets.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    const displayCat = CLEANING_SUBCATEGORIES.includes(p.category) ? "Cleaning" : p.category;
    if (categoryFilter !== "all" && displayCat !== categoryFilter) return false;
    if (roomFilter !== "all" && p.room !== roomFilter) return false;
    if (frequencyFilter !== "all") {
      const band = FREQUENCY_BANDS.find(b => b.value === frequencyFilter);
      if (band && (p.frequency_days < band.min || p.frequency_days > band.max)) return false;
    }
    return true;
  });

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") cmp = a.name.localeCompare(b.name);
    else if (sortBy === "room") cmp = (a.room || "zzz").localeCompare(b.room || "zzz");
    else if (sortBy === "frequency") cmp = a.frequency_days - b.frequency_days;
    else if (sortBy === "difficulty") cmp = DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
    else if (sortBy === "description") cmp = (a.description || "").localeCompare(b.description || "");
    else {
      const catA = CLEANING_SUBCATEGORIES.includes(a.category) ? "Cleaning" : a.category;
      const catB = CLEANING_SUBCATEGORIES.includes(b.category) ? "Cleaning" : b.category;
      cmp = catA.localeCompare(catB) || a.name.localeCompare(b.name);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });



  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-5 hover:bg-muted/40 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <h2 className="font-heading font-semibold text-lg text-foreground">Browse Presets</h2>
          <div className="flex items-center gap-2">
            <span className="text-base text-muted-foreground">{presets.length || ""} presets</span>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {open && (
          <div className="px-4 pb-5 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search presets..." className="pl-9 h-9 text-sm" />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <MobileSelect value={categoryFilter} onValueChange={setCategoryFilter} title="Filter Category" triggerClassName="w-full"
                options={[{ value: "all", label: "All Categories" }, ...displayCategories.map(c => ({ value: c, label: c }))]}
              />
              <MobileSelect value={roomFilter} onValueChange={setRoomFilter} title="Filter Room" triggerClassName="w-full"
                options={[{ value: "all", label: "All Rooms" }, ...displayRooms.map(r => ({ value: r, label: r }))]}
              />
              <MobileSelect value={frequencyFilter} onValueChange={setFrequencyFilter} title="Filter Frequency" triggerClassName="w-full"
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

            {/* Results */}
            {!loaded ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No presets match your search.</p>
            ) : (
              <div className="overflow-x-auto">
               <TableHeader sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
               <div className="max-h-[60vh] overflow-y-auto mt-1">
                {sorted.map(p => (
                  <PresetRow key={p.id} p={p} onAdd={handleAdd} />
                ))}
              </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddTaskDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialPreset={addTaskPreset}
        onTaskAdded={onTaskAdded}
      />
    </>
  );
}