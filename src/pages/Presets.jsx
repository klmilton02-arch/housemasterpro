import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatFrequency } from "../components/TaskCard";

export default function Presets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    base44.entities.PresetTask.list("name", 500).then(p => {
      setPresets(p);
      setLoading(false);
    });
  }, []);

  const categories = [...new Set(presets.map(p => p.category))];

  const filtered = presets.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (typeFilter !== "all" && p.task_type !== typeFilter) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
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
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> Preset Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Browse {presets.length} preset tasks with recommended frequencies</p>
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
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
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
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}