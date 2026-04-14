import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "@/utils/gamification";
import {
  JOCKEY_COLORS, HORSE_SKINS, SADDLES, SHOES, ARMORS, ACCESSORIES,
  getHorseEmoji, getTotalBonus, getEquippedEmojis
} from "@/utils/horseItems";
import { Lock, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

export default function Stable() {
  const [profile, setProfile] = useState(null);
  const [stable, setStable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      if (!me) return;

      const [profiles, stables] = await Promise.all([
        base44.entities.GamificationProfile.filter({ family_member_name: me.full_name }),
        base44.entities.HorseStable.filter({ family_member_name: me.full_name }),
      ]);

      const prof = profiles[0] || null;
      setProfile(prof);

      if (stables[0]) {
        setStable(stables[0]);
      } else {
        // Create default stable
        const memberId = prof?.family_member_id || me.id;
        const newStable = await base44.entities.HorseStable.create({
          family_member_id: memberId,
          family_member_name: me.full_name,
          jockey_color: "red",
          horse_skin: "brown",
          saddle: "none",
          shoes: "none",
          armor: "none",
          accessory: "none",
        });
        setStable(newStable);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function update(field, value) {
    const updated = { ...stable, [field]: value };
    setStable(updated);
    setSaving(true);
    await base44.entities.HorseStable.update(stable.id, { [field]: value });
    setSaving(false);
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
  const totalBonus = getTotalBonus(stable);
  const equippedEmojis = getEquippedEmojis(stable);
  const horseEmoji = getHorseEmoji(stable?.horse_skin);
  const jockeyColor = JOCKEY_COLORS.find(c => c.id === stable?.jockey_color)?.color || "#ef4444";

  return (
    <div className="space-y-6 max-w-xs mx-auto px-1 pt-6 pb-12">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Stable 🏇</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your racing horse</p>
      </div>

      {/* Horse preview */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="relative">
          {/* Jockey color sash */}
          <div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow"
            style={{ background: jockeyColor }}
          />
          <span className="text-6xl">{horseEmoji}</span>
        </div>
        <div className="flex gap-1 flex-wrap justify-center text-xl">
          {equippedEmojis.map((e, i) => <span key={i}>{e}</span>)}
        </div>
        <p className="font-heading font-bold text-lg">{profile.family_member_name?.split(" ")[0]}'s Horse</p>
        <p className="text-sm text-muted-foreground">Lv.{level} · {profile.total_xp || 0} XP</p>
        {totalBonus > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+{totalBonus}% speed bonus</span>
          </div>
        )}
        {saving && <p className="text-xs text-muted-foreground animate-pulse">Saving...</p>}
      </div>

      {/* Jockey Color */}
      <section>
        <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🎨 Jockey Color</h2>
        <ColorGrid items={JOCKEY_COLORS} equipped={stable?.jockey_color} onEquip={v => update("jockey_color", v)} level={level} />
      </section>

      {/* Horse Skin */}
      <section>
        <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🐴 Horse</h2>
        <div className="grid grid-cols-4 gap-2">
          {HORSE_SKINS.map(skin => {
            const locked = skin.unlockLevel > level;
            const isEquipped = stable?.horse_skin === skin.id;
            return (
              <button
                key={skin.id}
                disabled={locked}
                onClick={() => !locked && update("horse_skin", skin.id)}
                className={`relative rounded-xl border-2 p-2 flex flex-col items-center gap-1 transition-all
                  ${isEquipped ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/50"}
                  ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                `}
              >
                {locked && <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />}
                <span className="text-2xl">{skin.emoji}</span>
                <span className="text-xs">{skin.label}</span>
                {locked && <span className="text-xs text-muted-foreground">Lv.{skin.unlockLevel}</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Saddle */}
      <section>
        <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🏇 Saddle</h2>
        <ItemGrid items={SADDLES} equipped={stable?.saddle} onEquip={v => update("saddle", v)} level={level} />
      </section>

      {/* Shoes */}
      <section>
        <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">👟 Shoes</h2>
        <ItemGrid items={SHOES} equipped={stable?.shoes} onEquip={v => update("shoes", v)} level={level} />
      </section>

      {/* Armor */}
      <section>
        <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">🛡️ Armor</h2>
        <ItemGrid items={ARMORS} equipped={stable?.armor} onEquip={v => update("armor", v)} level={level} />
      </section>

      {/* Accessories */}
      <section>
        <h2 className="font-heading font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">✨ Accessories</h2>
        <ItemGrid items={ACCESSORIES} equipped={stable?.accessory} onEquip={v => update("accessory", v)} level={level} />
      </section>
    </div>
  );
}