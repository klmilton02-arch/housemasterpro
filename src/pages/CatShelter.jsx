import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "@/utils/gamification";
import {
  CAT_FURS, COLLARS, TOYS, ACCESSORIES,
  getCatEmoji, getCatEquippedEmojis, getCatTotalBonus,
} from "@/utils/catItems";
import { Lock, CheckCircle2, Plus, Trash2, Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { differenceInDays, parseISO, subDays } from "date-fns";

// ─── Item Grid (collars / toys / accessories) ─────────────────────────────────
function ItemGrid({ items, equipped, onEquip, level }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => {
        const locked = item.unlockLevel > level;
        const isEquipped = equipped === item.id;
        return (
          <button
            key={item.id}
            disabled={locked}
            onClick={() => !locked && onEquip(item.id)}
            className={`relative rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all
              ${isEquipped ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/50"}
              ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
            `}
          >
            {locked && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-muted-foreground" />}
            {isEquipped && <CheckCircle2 className="absolute top-1.5 right-1.5 w-3 h-3 text-primary" />}
            <span className="text-2xl">{item.emoji || "—"}</span>
            <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            {item.bonus > 0 && <span className="text-xs text-amber-600 font-bold">+{item.bonus}%</span>}
            {locked && <span className="text-xs text-muted-foreground">Lv.{item.unlockLevel}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Fur Grid ─────────────────────────────────────────────────────────────────
function FurGrid({ items, equipped, onEquip, level }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(item => {
        const locked = item.unlockLevel > level;
        const isEquipped = equipped === item.id;
        return (
          <button
            key={item.id}
            disabled={locked}
            onClick={() => !locked && onEquip(item.id)}
            className={`relative rounded-xl border-2 p-2 flex flex-col items-center gap-1 transition-all
              ${isEquipped ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/50"}
              ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
            `}
          >
            {locked && <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />}
            {isEquipped && <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-primary" />}
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-xs leading-tight text-center">{item.label}</span>
            {locked && <span className="text-xs text-muted-foreground">Lv.{item.unlockLevel}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Cat Card ─────────────────────────────────────────────────────────────────
function CatCard({ cat, onSelect, isSelected, onDelete }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastFed = cat.last_fed_date ? parseISO(cat.last_fed_date) : null;
  lastFed?.setHours(0, 0, 0, 0);
  const daysSinceFed = lastFed ? differenceInDays(today, lastFed) : 999;
  const needsFood = daysSinceFed > 0;
  const isAway = cat.is_home === false;
  const emojis = getCatEquippedEmojis(cat);

  return (
    <div
      onClick={() => onSelect(cat)}
      className={`border rounded-xl p-3 cursor-pointer transition-all ${
        isAway
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
          : isSelected
          ? "border-primary bg-primary/10"
          : needsFood
          ? "border-orange-400 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/20"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{isAway ? "🏃" : getCatEmoji(cat.cat_fur)}</span>
            <div>
              <p className="font-semibold text-sm">{cat.cat_name}</p>
              {isAway ? (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" /> Ran away!
                </p>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <Heart className={`w-3 h-3 ${cat.health > 50 ? "text-pink-500" : "text-red-500"}`} />
                  <span className="text-xs text-muted-foreground">{cat.health ?? 100}% happy</span>
                </div>
              )}
            </div>
          </div>
          {emojis.length > 0 && (
            <div className="flex gap-0.5 mt-1">{emojis.map((e, i) => <span key={i} className="text-sm">{e}</span>)}</div>
          )}
          {!isAway && needsFood && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">🐟 Hungry!</p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(cat.id); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CatShelter() {
  const [profile, setProfile] = useState(null);
  const [cats, setCats] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      if (!me) return;
      const [profiles, allCats, allTasks] = await Promise.all([
        base44.entities.GamificationProfile.filter({ family_member_name: me.full_name }),
        base44.entities.CatShelter.filter({ family_member_name: me.full_name }),
        base44.entities.Task.list(),
      ]);

      // Count seriously overdue tasks (more than grace period)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const severelyOverdue = allTasks.filter(t => {
        if (t.status === "Completed") return false;
        if (!t.next_due_date) return false;
        const due = parseISO(t.next_due_date);
        due.setHours(0, 0, 0, 0);
        const graceDays = t.overdue_grace_days || 3;
        return differenceInDays(today, due) > graceDays;
      }).length;

      // If 3+ severely overdue tasks, cats that are home may run away
      const updatedCats = await Promise.all(allCats.map(async cat => {
        if (cat.is_home && severelyOverdue >= 3) {
          // Each cat has a chance to run — more overdue = more likely
          const threshold = Math.max(3, 6 - Math.floor(severelyOverdue / 2));
          if (severelyOverdue >= threshold) {
            await base44.entities.CatShelter.update(cat.id, {
              is_home: false,
              ran_away_date: today.toISOString().split("T")[0],
              health: Math.max(10, (cat.health ?? 100) - 30),
            });
            return { ...cat, is_home: false, ran_away_date: today.toISOString().split("T")[0] };
          }
        }
        return cat;
      }));

      setProfile(profiles[0] || null);
      setCats(updatedCats);
      if (updatedCats.length > 0) setSelectedCat(updatedCats[0]);
      setLoading(false);
    }
    load();
  }, []);

  async function createCat() {
    const me = await base44.auth.me();
    if (!me || !profile) return;
    const newCat = await base44.entities.CatShelter.create({
      family_member_id: profile.family_member_id || me.id,
      family_member_name: me.full_name,
      family_group_id: me.family_group_id || "",
      cat_name: `Cat ${cats.length + 1}`,
      cat_fur: "orange",
      collar: "none",
      toy: "none",
      accessory: "none",
      health: 100,
      last_fed_date: new Date().toISOString().split("T")[0],
      last_played_date: new Date().toISOString().split("T")[0],
      is_home: true,
    });
    setCats([...cats, newCat]);
    setSelectedCat(newCat);
    toast({ title: "New cat adopted! 🐱", description: `${newCat.cat_name} is now part of your family.` });
  }

  async function feedCat() {
    if (!selectedCat || !profile) return;
    const cost = 5;
    if ((profile.total_xp || 0) < cost) {
      toast({ title: "Not enough XP", description: "You need 5 XP to feed your cat." });
      return;
    }
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const newHealth = Math.min(100, (selectedCat.health ?? 100) + 20);
    await Promise.all([
      base44.entities.CatShelter.update(selectedCat.id, { health: newHealth, last_fed_date: today, is_home: true }),
      base44.entities.GamificationProfile.update(profile.id, { total_xp: (profile.total_xp || 0) - cost }),
    ]);
    setSaving(false);
    const updated = { ...selectedCat, health: newHealth, last_fed_date: today, is_home: true };
    setSelectedCat(updated);
    setCats(cats.map(c => c.id === selectedCat.id ? updated : c));
    setProfile({ ...profile, total_xp: (profile.total_xp || 0) - cost });
    toast({ title: "Fed your cat! 🐟", description: `${selectedCat.cat_name} is purring.` });
  }

  async function playCat() {
    if (!selectedCat || !profile) return;
    const cost = 10;
    if ((profile.total_xp || 0) < cost) {
      toast({ title: "Not enough XP", description: "You need 10 XP to play with your cat." });
      return;
    }
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const newHealth = Math.min(100, (selectedCat.health ?? 100) + 15);
    await Promise.all([
      base44.entities.CatShelter.update(selectedCat.id, { last_played_date: today, health: newHealth, is_home: true }),
      base44.entities.GamificationProfile.update(profile.id, { total_xp: (profile.total_xp || 0) - cost }),
    ]);
    setSaving(false);
    const updated = { ...selectedCat, last_played_date: today, health: newHealth, is_home: true };
    setSelectedCat(updated);
    setCats(cats.map(c => c.id === selectedCat.id ? updated : c));
    setProfile({ ...profile, total_xp: (profile.total_xp || 0) - cost });
    toast({ title: "Playtime! 🎾", description: `${selectedCat.cat_name} is having a blast.` });
  }

  async function bringCatHome() {
    if (!selectedCat || !profile) return;
    const cost = 20;
    if ((profile.total_xp || 0) < cost) {
      toast({ title: "Not enough XP", description: "You need 20 XP to coax your cat home." });
      return;
    }
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      base44.entities.CatShelter.update(selectedCat.id, { is_home: true, health: 60, last_fed_date: today }),
      base44.entities.GamificationProfile.update(profile.id, { total_xp: (profile.total_xp || 0) - cost }),
    ]);
    setSaving(false);
    const updated = { ...selectedCat, is_home: true, health: 60, last_fed_date: today };
    setSelectedCat(updated);
    setCats(cats.map(c => c.id === selectedCat.id ? updated : c));
    setProfile({ ...profile, total_xp: (profile.total_xp || 0) - cost });
    toast({ title: "Cat came home! 🏠", description: `${selectedCat.cat_name} is back, but needs some love.` });
  }

  async function deleteCat(catId) {
    setSaving(true);
    await base44.entities.CatShelter.delete(catId);
    setSaving(false);
    const filtered = cats.filter(c => c.id !== catId);
    setCats(filtered);
    setSelectedCat(filtered[0] || null);
    toast({ title: "Cat rehomed", description: "Your cat found a new home." });
  }

  async function updateCat(field, value) {
    if (!selectedCat) return;
    const updated = { ...selectedCat, [field]: value };
    setSelectedCat(updated);
    setSaving(true);
    await base44.entities.CatShelter.update(selectedCat.id, { [field]: value });
    setSaving(false);
    setCats(cats.map(c => c.id === selectedCat.id ? updated : c));
    toast({ title: "Saved! ✨", description: "Your cat has been updated." });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xs mx-auto px-1 pt-6 text-center space-y-4">
        <p className="text-5xl">🐱</p>
        <p className="font-heading font-bold text-lg">No cats yet!</p>
        <p className="text-sm text-muted-foreground">Complete tasks to earn XP and adopt your first cat.</p>
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.total_xp || 0);
  const level = levelInfo.level;
  const isAway = selectedCat?.is_home === false;

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-1 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Cats 🐱</h1>
          <p className="text-sm text-muted-foreground mt-1">Care for your cats · Lv.{level} · {profile.total_xp} XP</p>
        </div>
        <Button onClick={createCat} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Adopt
        </Button>
      </div>

      {/* Info banner: cats run away */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
        ⚠️ <strong>Heads up:</strong> Cats can run away if you leave too many tasks overdue! Keep up with chores to keep them happy and home.
      </div>

      {cats.length === 0 ? (
        <div className="text-center space-y-3 py-8">
          <p className="text-4xl">🐱</p>
          <p className="text-sm text-muted-foreground">No cats yet. Adopt your first one!</p>
        </div>
      ) : (
        <>
          {/* Cat list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cats.map(cat => (
              <CatCard
                key={cat.id}
                cat={cat}
                isSelected={selectedCat?.id === cat.id}
                onSelect={setSelectedCat}
                onDelete={deleteCat}
              />
            ))}
          </div>

          {selectedCat && (
            <>
              {/* Selected Cat Detail */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={selectedCat.cat_name}
                    onChange={e => setSelectedCat({ ...selectedCat, cat_name: e.target.value })}
                    onBlur={e => {
                      const v = e.target.value.trim();
                      if (v) updateCat("cat_name", v);
                      else setSelectedCat({ ...selectedCat, cat_name: selectedCat.cat_name || "My Cat" });
                    }}
                    className="font-heading font-bold text-xl bg-transparent border-b border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <span className="font-bold">{selectedCat.health ?? 100}%</span>
                  </div>
                </div>

                {isAway && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                    😿 <strong>{selectedCat.cat_name}</strong> ran away because of overdue chores! Spend 20 XP to coax them back.
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {isAway ? (
                    <Button
                      onClick={bringCatHome}
                      disabled={saving || (profile.total_xp || 0) < 20}
                      className="gap-1 col-span-2"
                    >
                      🏠 Bring Home (20 XP)
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={feedCat}
                        disabled={saving || (profile.total_xp || 0) < 5}
                        variant="outline"
                        className="gap-1"
                      >
                        🐟 Feed (5 XP)
                      </Button>
                      <Button
                        onClick={playCat}
                        disabled={saving || (profile.total_xp || 0) < 10}
                        variant="outline"
                        className="gap-1"
                      >
                        🧶 Play (10 XP)
                      </Button>
                    </>
                  )}
                </div>

                {saving && <p className="text-xs text-muted-foreground animate-pulse">Saving...</p>}
              </div>

              {/* Fur */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🐾 Fur Type</h2>
                <FurGrid items={CAT_FURS} equipped={selectedCat.cat_fur} onEquip={v => updateCat("cat_fur", v)} level={level} />
              </section>

              {/* Collars */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🔔 Collar</h2>
                <ItemGrid items={COLLARS} equipped={selectedCat.collar} onEquip={v => updateCat("collar", v)} level={level} />
              </section>

              {/* Toys */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🧶 Toy</h2>
                <ItemGrid items={TOYS} equipped={selectedCat.toy} onEquip={v => updateCat("toy", v)} level={level} />
              </section>

              {/* Accessories */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🎀 Accessory</h2>
                <ItemGrid items={ACCESSORIES} equipped={selectedCat.accessory} onEquip={v => updateCat("accessory", v)} level={level} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}