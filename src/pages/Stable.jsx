import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "@/utils/gamification";
import {
  JOCKEY_COLORS, SADDLES, SHOES, ARMORS, ACCESSORIES,
  getHorseEmoji, getTotalBonus, getEquippedEmojis
} from "@/utils/horseItems";
import { Lock, CheckCircle2, Zap, Plus, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";

function ColorGrid({ items, equipped, onEquip, level }) {
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
              ${isEquipped ? "border-primary" : "border-border"}
              ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
            `}
          >
            {locked && <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />}
            <div
              className="w-7 h-7 rounded-full border border-border"
              style={{ background: item.color }}
            />
            <span className="text-xs">{item.label}</span>
            {locked && <span className="text-xs text-muted-foreground">Lv.{item.unlockLevel}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ItemGrid({ items, equipped, onEquip, level, hideEmoji = false }) {
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
            {!hideEmoji && <span className="text-2xl">{item.emoji || "—"}</span>}
            <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            {item.bonus > 0 && (
              <span className="text-xs text-amber-600 font-bold">+{item.bonus}%</span>
            )}
            {locked && (
              <span className="text-xs text-muted-foreground">Lv.{item.unlockLevel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function HorseCard({ horse, profile, onFeed, onDelete, onSelect, isSelected }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastFed = horse.last_fed_date ? parseISO(horse.last_fed_date) : null;
  lastFed?.setHours(0, 0, 0, 0);
  const daysSinceFed = lastFed ? differenceInDays(today, lastFed) : 999;
  const needsFood = daysSinceFed > 0;
  const horseEmoji = getHorseEmoji(horse.horse_skin);
  const equippedEmojis = getEquippedEmojis(horse);

  return (
    <div
      onClick={() => onSelect(horse)}
      className={`border rounded-xl p-3 cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/10"
          : needsFood
          ? "border-orange-400 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/20"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{horseEmoji}</span>
            <div>
              <p className="font-semibold text-sm">{horse.horse_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Heart className={`w-3 h-3 ${horse.health > 50 ? "text-green-500" : "text-red-500"}`} />
                <span className="text-xs text-muted-foreground">{horse.health}%</span>
              </div>
            </div>
          </div>
          {equippedEmojis.length > 0 && (
            <div className="flex gap-0.5 mt-1">{equippedEmojis.map((e, i) => <span key={i} className="text-sm">{e}</span>)}</div>
          )}
          {needsFood && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">🍎 Needs food!</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(horse.id); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Stable() {
  const [profile, setProfile] = useState(null);
  const [horses, setHorses] = useState([]);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      if (!me) return;

      const [profiles, allHorses] = await Promise.all([
        base44.entities.GamificationProfile.filter({ family_member_name: me.full_name }),
        base44.entities.HorseStable.filter({ family_member_name: me.full_name }),
      ]);

      const prof = profiles[0] || null;
      setProfile(prof);
      setHorses(allHorses);
      if (allHorses.length > 0) setSelectedHorse(allHorses[0]);
      setLoading(false);
    }
    load();
  }, []);

  async function createHorse() {
    const me = await base44.auth.me();
    if (!me || !profile) return;

    const newHorse = await base44.entities.HorseStable.create({
      family_member_id: profile.family_member_id || me.id,
      family_member_name: me.full_name,
      horse_name: `Horse ${horses.length + 1}`,
      jockey_color: "red",
      horse_skin: "brown",
      saddle: "none",
      shoes: "none",
      armor: "none",
      accessory: "none",
      health: 100,
      last_fed_date: new Date().toISOString().split("T")[0],
      last_activity_date: new Date().toISOString().split("T")[0],
      is_alive: true,
    });
    setHorses([...horses, newHorse]);
    setSelectedHorse(newHorse);
    toast({ title: "Horse created!", description: `${newHorse.horse_name} joined your stable.` });
  }

  async function feedHorse() {
    if (!selectedHorse || !profile) return;

    const cost = 5;
    if ((profile.total_xp || 0) < cost) {
      toast({ title: "Not enough XP", description: "You need 5 XP to feed your horse." });
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      base44.entities.HorseStable.update(selectedHorse.id, {
        health: Math.min(100, (selectedHorse.health || 100) + 20),
        last_fed_date: today,
        last_activity_date: today,
      }),
      base44.entities.GamificationProfile.update(profile.id, {
        total_xp: (profile.total_xp || 0) - cost,
      }),
    ]);
    setSaving(false);

    const updated = { ...selectedHorse, health: Math.min(100, (selectedHorse.health || 100) + 20), last_fed_date: today };
    setSelectedHorse(updated);
    setHorses(horses.map(h => h.id === selectedHorse.id ? updated : h));
    setProfile({ ...profile, total_xp: (profile.total_xp || 0) - cost });
    toast({ title: "Fed your horse!", description: `${selectedHorse.horse_name} is happy now.` });
  }

  async function trainHorse() {
    if (!selectedHorse || !profile) return;

    const cost = 10;
    if ((profile.total_xp || 0) < cost) {
      toast({ title: "Not enough XP", description: "You need 10 XP to train your horse." });
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      base44.entities.HorseStable.update(selectedHorse.id, {
        last_activity_date: today,
      }),
      base44.entities.GamificationProfile.update(profile.id, {
        total_xp: (profile.total_xp || 0) - cost,
      }),
    ]);
    setSaving(false);

    const updated = { ...selectedHorse, last_activity_date: today };
    setSelectedHorse(updated);
    setHorses(horses.map(h => h.id === selectedHorse.id ? updated : h));
    setProfile({ ...profile, total_xp: (profile.total_xp || 0) - cost });
    toast({ title: "Trained your horse!", description: "Your horse is getting stronger." });
  }

  async function deleteHorse() {
    if (!selectedHorse) return;
    setSaving(true);
    await base44.entities.HorseStable.delete(selectedHorse.id);
    setSaving(false);
    const filtered = horses.filter(h => h.id !== selectedHorse.id);
    setHorses(filtered);
    setSelectedHorse(filtered[0] || null);
    toast({ title: "Horse removed", description: "Your horse has left the stable." });
  }

  async function update(field, value) {
    if (!selectedHorse) return;
    const updated = { ...selectedHorse, [field]: value };
    setSelectedHorse(updated);
    setSaving(true);
    await base44.entities.HorseStable.update(selectedHorse.id, { [field]: value });
    setSaving(false);
    setHorses(horses.map(h => h.id === selectedHorse.id ? updated : h));
    toast({ title: "Saved!", description: "Your horse has been updated." });
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
        <p className="text-5xl">🐴</p>
        <p className="font-heading font-bold text-lg">No stable yet!</p>
        <p className="text-sm text-muted-foreground">Complete tasks to earn XP and unlock your stable.</p>
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.total_xp || 0);
  const level = levelInfo.level;

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-1 pt-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Stable 🏇</h1>
          <p className="text-sm text-muted-foreground mt-1">Care for your horses · Lv.{level} · {profile.total_xp} XP</p>
        </div>
        <Button onClick={createHorse} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {horses.length === 0 ? (
        <div className="text-center space-y-3 py-8">
          <p className="text-4xl">🐴</p>
          <p className="text-sm text-muted-foreground">No horses yet. Create your first one!</p>
        </div>
      ) : (
        <>
          {/* Horses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {horses.map(horse => (
              <HorseCard
                key={horse.id}
                horse={horse}
                profile={profile}
                onFeed={feedHorse}
                onDelete={deleteHorse}
                onSelect={setSelectedHorse}
                isSelected={selectedHorse?.id === horse.id}
              />
            ))}
          </div>

          {selectedHorse && (
            <>
              {/* Selected Horse Detail */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={selectedHorse.horse_name}
                    onChange={(e) => update("horse_name", e.target.value)}
                    className="font-heading font-bold text-xl bg-transparent border-b border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-bold">{selectedHorse.health || 100}%</span>
                  </div>
                </div>

                {/* Care Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={feedHorse}
                    disabled={saving || (profile.total_xp || 0) < 5}
                    className="gap-1"
                    variant="outline"
                  >
                    <span>🍎</span> Feed (5 XP)
                  </Button>
                  <Button
                    onClick={trainHorse}
                    disabled={saving || (profile.total_xp || 0) < 10}
                    className="gap-1"
                    variant="outline"
                  >
                    <span>💪</span> Train (10 XP)
                  </Button>
                </div>

                {saving && <p className="text-xs text-muted-foreground animate-pulse">Saving...</p>}
              </div>

              {/* Jockey Color */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🎨 Jockey Color</h2>
                <ColorGrid items={JOCKEY_COLORS} equipped={selectedHorse?.jockey_color} onEquip={v => update("jockey_color", v)} level={level} />
              </section>

              {/* Saddle */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🏇 Saddle</h2>
                <ItemGrid items={SADDLES} equipped={selectedHorse?.saddle} onEquip={v => update("saddle", v)} level={level} hideEmoji={true} />
              </section>

              {/* Shoes */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">👟 Shoes</h2>
                <ItemGrid items={SHOES} equipped={selectedHorse?.shoes} onEquip={v => update("shoes", v)} level={level} hideEmoji={true} />
              </section>

              {/* Accessories */}
              <section>
                <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">✨ Accessories</h2>
                <ItemGrid items={ACCESSORIES} equipped={selectedHorse?.accessory} onEquip={v => update("accessory", v)} level={level} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}