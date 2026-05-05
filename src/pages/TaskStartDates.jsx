import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaskStartDates() {
  const navigate = useNavigate();
  const [homeSetup, setHomeSetup] = useState(null);
  const [startDates, setStartDates] = useState({ cleaning: "", maintenance: "", bills: "", personal: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    const setups = await base44.entities.HomeSetup.list();
    if (setups.length > 0) {
      const s = setups[0];
      setHomeSetup(s);
      setStartDates({
        cleaning: s.start_date_cleaning || "",
        maintenance: s.start_date_maintenance || "",
        bills: s.start_date_bills || "",
        personal: s.start_date_personal || "",
      });
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave() {
    setSaving(true);
    const data = {
      start_date_cleaning: startDates.cleaning || null,
      start_date_maintenance: startDates.maintenance || null,
      start_date_bills: startDates.bills || null,
      start_date_personal: startDates.personal || null,
    };
    if (homeSetup) {
      await base44.entities.HomeSetup.update(homeSetup.id, data);
    } else {
      const created = await base44.entities.HomeSetup.create(data);
      setHomeSetup(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-10 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-heading text-2xl font-bold">Task Start Dates</h1>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-cyan-700">Set the start date for each task type. New tasks will begin from this date.</p>
            <p className="text-xs text-cyan-600 mt-1 italic">💡 Leave blank to auto-schedule: daily → tomorrow, weekly → next week, monthly → next month.</p>
            <p className="text-xs text-cyan-800 font-medium mt-1 cursor-help" title="Pick today if you are a glutton for punishment and want ALL tasks to start today.">⚠️ Hover here before picking today's date.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: "cleaning", label: "Cleaning", color: "bg-blue-50 border-blue-200" },
          { key: "maintenance", label: "Maintenance", color: "bg-yellow-50 border-yellow-200" },
          { key: "bills", label: "Bills", color: "bg-green-50 border-green-200" },
          { key: "personal", label: "Personal", color: "bg-pink-50 border-pink-200" },
        ].map(({ key, label, color }) => (
          <div key={key} className={`border rounded-lg p-4 space-y-2 ${color}`}>
            <label className="text-sm font-semibold">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDates[key]}
                onChange={e => setStartDates(prev => ({ ...prev, [key]: e.target.value }))}
                className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-white text-foreground"
              />
              {startDates[key] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStartDates(prev => ({ ...prev, [key]: "" }))}
                  className="text-xs px-2 text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-cyan-500 text-white hover:bg-cyan-600"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Start Dates"}
      </Button>
    </div>
  );
}