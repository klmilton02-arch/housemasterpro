import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "@/utils/gamification";

const HORSE_EMOJIS = ["🐴", "🦄", "🐎", "🏇", "🐴", "🦄"];
const TRACK_LENGTH = 100; // percentage

const AVATAR_COLORS = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

const LANE_COLORS = [
  "from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
  "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
  "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800",
  "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
  "from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 border-pink-200 dark:border-pink-800",
  "from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200 dark:border-teal-800",
];

export default function HorseRace() {
  const [profiles, setProfiles] = useState([]);
  const [positions, setPositions] = useState({});
  const [racing, setRacing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lap, setLap] = useState({});
  const animRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    base44.entities.GamificationProfile.list("-total_xp", 6).then(p => {
      setProfiles(p);
      const init = {};
      p.forEach(prof => { init[prof.id] = 0; });
      setPositions(init);
    });
  }, []);

  function startRace() {
    if (racing) return;
    setWinner(null);
    const init = {};
    profiles.forEach(p => { init[p.id] = 0; });
    setPositions(init);
    setLap({});
    setRacing(true);
    startRef.current = Date.now();

    // Each horse gets a speed based on XP + random factor
    const maxXP = Math.max(...profiles.map(p => p.total_xp || 1), 1);
    const speeds = {};
    profiles.forEach(p => {
      const xpFactor = ((p.total_xp || 0) / maxXP) * 0.4 + 0.6; // 0.6–1.0 based on XP
      speeds[p.id] = xpFactor * (0.85 + Math.random() * 0.3); // add randomness
    });

    const finishOrder = [];

    function animate() {
      setPositions(prev => {
        const next = { ...prev };
        let allDone = true;
        profiles.forEach(p => {
          if (next[p.id] < TRACK_LENGTH) {
            allDone = false;
            next[p.id] = Math.min(TRACK_LENGTH, next[p.id] + speeds[p.id] * 0.4);
            if (next[p.id] >= TRACK_LENGTH && !finishOrder.includes(p.id)) {
              finishOrder.push(p.id);
              if (finishOrder.length === 1) {
                setWinner(p);
              }
            }
          }
        });
        if (allDone) {
          setRacing(false);
          return next;
        }
        return next;
      });

      if (racing || finishOrder.length < profiles.length) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Stop animation when all done
  useEffect(() => {
    if (!racing && animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
  }, [racing]);

  if (profiles.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Complete tasks to get horses on the track!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Track */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        {/* Finish line */}
        <div className="absolute right-0 top-0 bottom-0 w-6 z-10 flex flex-col items-center justify-start pt-1 gap-px pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`w-3 h-3 ${i % 2 === 0 ? "bg-black" : "bg-white"}`} />
          ))}
        </div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-red-400 z-10" />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium z-10">START</div>

        <div className="py-1 pr-8 pl-12">
          {profiles.map((profile, idx) => {
            const pos = positions[profile.id] || 0;
            const levelInfo = getLevelInfo(profile.total_xp || 0);
            const isLeading = Object.values(positions).every(p => pos >= p);

            return (
              <div
                key={profile.id}
                className={`relative flex items-center my-1 rounded-lg bg-gradient-to-r border ${LANE_COLORS[idx % LANE_COLORS.length]} h-12 overflow-hidden`}
              >
                {/* Grass dashes */}
                <div className="absolute inset-0 flex items-center gap-4 px-2 pointer-events-none opacity-20">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-px flex-1 border-t border-dashed border-current" />
                  ))}
                </div>

                {/* Horse */}
                <div
                  className="absolute transition-none flex flex-col items-center"
                  style={{ left: `${pos}%`, transform: "translateX(-50%)", minWidth: 40 }}
                >
                  <span className="text-2xl leading-none">{HORSE_EMOJIS[idx % HORSE_EMOJIS.length]}</span>
                  {isLeading && racing && (
                    <span className="text-xs">🏅</span>
                  )}
                </div>

                {/* Name label */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground truncate max-w-[60px] text-right">
                  {profile.family_member_name?.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner banner */}
      {winner && !racing && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl p-4 text-center animate-bounce">
          <p className="text-2xl">🏆</p>
          <p className="font-heading font-bold text-amber-700 dark:text-amber-400 text-lg">
            {winner.family_member_name} wins!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Lv.{getLevelInfo(winner.total_xp || 0).level} · {winner.total_xp || 0} XP
          </p>
        </div>
      )}

      {/* Riders list */}
      <div className="grid grid-cols-2 gap-2">
        {profiles.map((profile, idx) => {
          const levelInfo = getLevelInfo(profile.total_xp || 0);
          return (
            <div key={profile.id} className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg">{HORSE_EMOJIS[idx % HORSE_EMOJIS.length]}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{profile.family_member_name?.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">Lv.{levelInfo.level} · {profile.total_xp || 0} XP</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={startRace}
        disabled={racing}
        className="w-full py-3 rounded-xl font-heading font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md text-lg"
      >
        {racing ? "🏇 Racing..." : winner ? "🔄 Race Again!" : "🏁 Start Race!"}
      </button>
    </div>
  );
}