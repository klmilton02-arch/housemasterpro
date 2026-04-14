import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "@/utils/gamification";
import { getHorseEmoji, getTotalBonus, getEquippedEmojis, JOCKEY_COLORS } from "@/utils/horseItems";

const TRACK_DEFAULT_EMOJI = "🐴";

const CX = 200;
const CY = 160;
const RX = 155;
const RY = 100;
const TRACK_WIDTH = 36;

function ellipsePoint(cx, cy, rx, ry, t) {
  return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) };
}

export default function HorseRace() {
  const [profiles, setProfiles] = useState([]);
  const [stables, setStables] = useState({});   // keyed by family_member_id
  const [angles, setAngles] = useState({});
  const [racing, setRacing] = useState(false);
  const [winner, setWinner] = useState(null);
  const animRef = useRef(null);
  const speedsRef = useRef({});
  const finishRef = useRef([]);
  const racingRef = useRef(false);

  useEffect(() => {
    Promise.all([
      base44.entities.GamificationProfile.list("-total_xp", 6),
      base44.entities.HorseStable.list(),
    ]).then(([profs, stableList]) => {
      setProfiles(profs);
      const stableMap = {};
      stableList.forEach(s => { stableMap[s.family_member_id] = s; });
      setStables(stableMap);
      const init = {};
      profs.forEach(p => { init[p.id] = Math.PI / 2; });
      setAngles(init);
    });
  }, []);

  function startRace() {
    if (racingRef.current) return;
    setWinner(null);
    finishRef.current = [];
    racingRef.current = true;
    setRacing(true);

    const init = {};
    profiles.forEach(p => { init[p.id] = Math.PI / 2; });
    setAngles(init);

    const maxXP = Math.max(...profiles.map(p => p.total_xp || 1), 1);
    profiles.forEach(p => {
      const stable = stables[p.family_member_id];
      const xpFactor = ((p.total_xp || 0) / maxXP) * 0.4 + 0.6;
      const itemBonus = getTotalBonus(stable) / 100; // convert % to multiplier
      speedsRef.current[p.id] = (xpFactor + itemBonus * 0.3) * (0.012 + Math.random() * 0.008);
    });

    const traveled = {};
    profiles.forEach(p => { traveled[p.id] = 0; });

    function animate() {
      setAngles(prev => {
        const next = { ...prev };
        let allDone = true;
        profiles.forEach(p => {
          if (traveled[p.id] < Math.PI * 2) {
            allDone = false;
            traveled[p.id] += speedsRef.current[p.id];
            next[p.id] = Math.PI / 2 + traveled[p.id];
            if (traveled[p.id] >= Math.PI * 2 && !finishRef.current.includes(p.id)) {
              finishRef.current.push(p.id);
              if (finishRef.current.length === 1) setWinner(p);
            }
          }
        });
        if (allDone) {
          racingRef.current = false;
          setRacing(false);
        } else {
          animRef.current = requestAnimationFrame(animate);
        }
        return next;
      });
    }

    animRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const numLanes = profiles.length;
  const finishAngle = Math.PI / 2;

  if (profiles.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Complete tasks to get horses on the track!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Oval Track SVG */}
      <div className="relative w-full rounded-xl overflow-hidden bg-green-800 dark:bg-green-950 p-2">
        <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 300 }}>
          {/* Grass */}
          <ellipse cx={CX} cy={CY} rx={RX + 20} ry={RY + 20} fill="#15803d" opacity="0.6" />
          {/* Track surface */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#c2a06e" />
          {/* Inner grass */}
          <ellipse cx={CX} cy={CY} rx={RX - TRACK_WIDTH} ry={RY - TRACK_WIDTH} fill="#16a34a" />

          {/* Lane dividers */}
          {Array.from({ length: numLanes - 1 }).map((_, i) => {
            const r = ((i + 1) / numLanes);
            return (
              <ellipse key={i} cx={CX} cy={CY}
                rx={RX - r * TRACK_WIDTH} ry={RY - r * TRACK_WIDTH}
                fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.5"
              />
            );
          })}

          {/* Track borders */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="white" strokeWidth="1.5" />
          <ellipse cx={CX} cy={CY} rx={RX - TRACK_WIDTH} ry={RY - TRACK_WIDTH} fill="none" stroke="white" strokeWidth="1.5" />

          {/* Checkered finish line */}
          {Array.from({ length: 6 }).map((_, i) => {
            const frac0 = i / 6;
            const frac1 = (i + 1) / 6;
            const innerRX = RX - TRACK_WIDTH;
            const innerRY = RY - TRACK_WIDTH;
            const x1 = CX + (innerRX + frac0 * TRACK_WIDTH) * Math.cos(finishAngle);
            const y1 = CY + (innerRY + frac0 * TRACK_WIDTH) * Math.sin(finishAngle);
            const x2 = CX + (innerRX + frac1 * TRACK_WIDTH) * Math.cos(finishAngle);
            const y2 = CY + (innerRY + frac1 * TRACK_WIDTH) * Math.sin(finishAngle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? "white" : "black"} strokeWidth="4" />;
          })}

          {/* START label */}
          <text
            x={CX + (RX - TRACK_WIDTH / 2) * Math.cos(finishAngle) + 14}
            y={CY + (RY - TRACK_WIDTH / 2) * Math.sin(finishAngle) + 4}
            fontSize="8" fill="white" fontWeight="bold" textAnchor="middle"
          >START</text>

          {/* Horses */}
          {profiles.map((profile, idx) => {
            const angle = angles[profile.id] ?? (Math.PI / 2);
            const laneRatio = (idx + 0.5) / numLanes;
            const horseRX = RX - laneRatio * TRACK_WIDTH;
            const horseRY = RY - laneRatio * TRACK_WIDTH;
            const pos = ellipsePoint(CX, CY, horseRX, horseRY, angle);
            const stable = stables[profile.family_member_id];
            const horseEmoji = getHorseEmoji(stable?.horse_skin);
            const equippedEmojis = getEquippedEmojis(stable);
            const jockeyColor = JOCKEY_COLORS.find(c => c.id === stable?.jockey_color)?.color || "#ef4444";
            const isFirst = finishRef.current[0] === profile.id;

            return (
              <g key={profile.id}>
                {/* Shadow */}
                <ellipse cx={pos.x + 1} cy={pos.y + 2} rx={10} ry={5} fill="black" opacity="0.18" />

                {/* Jockey color dot */}
                <circle cx={pos.x + 7} cy={pos.y - 8} r={5} fill={jockeyColor} stroke="white" strokeWidth="1" />

                {/* Horse */}
                <text x={pos.x} y={pos.y + 6} fontSize="18" textAnchor="middle" style={{ userSelect: "none" }}>
                  {horseEmoji}
                </text>

                {/* Equipped item emojis (tiny) */}
                {equippedEmojis.slice(0, 2).map((e, i) => (
                  <text key={i} x={pos.x - 10 + i * 10} y={pos.y - 10} fontSize="8" textAnchor="middle" style={{ userSelect: "none" }}>
                    {e}
                  </text>
                ))}

                {/* Name */}
                <text x={pos.x} y={pos.y - 18} fontSize="7" textAnchor="middle" fill="white" fontWeight="bold"
                  paintOrder="stroke" stroke="black" strokeWidth="2" strokeLinejoin="round">
                  {profile.family_member_name?.split(" ")[0]}
                </text>

                {/* Winner crown */}
                {isFirst && !racing && (
                  <text x={pos.x} y={pos.y - 28} fontSize="10" textAnchor="middle">👑</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
          {profiles.map((profile, idx) => {
            const stable = stables[profile.family_member_id];
            const horseEmoji = getHorseEmoji(stable?.horse_skin);
            return (
              <div key={profile.id} className="flex items-center gap-1">
                <span className="text-xs">{horseEmoji}</span>
                <span className="text-xs text-white font-medium drop-shadow">
                  {profile.family_member_name?.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner banner */}
      {winner && !racing && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl p-4 text-center">
          <p className="text-2xl">🏆</p>
          <p className="font-heading font-bold text-amber-700 dark:text-amber-400 text-lg">
            {winner.family_member_name} wins!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Lv.{getLevelInfo(winner.total_xp || 0).level} · {winner.total_xp || 0} XP
          </p>
        </div>
      )}

      <button
        onClick={startRace}
        disabled={racing}
        className="w-full py-3 rounded-xl font-heading font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md text-lg"
      >
        {racing ? "🏇 Racing..." : winner ? "🔄 Race Again!" : "🏁 Start Race!"}
      </button>

      {/* Riders grid */}
      <div className="grid grid-cols-2 gap-2">
        {profiles.map((profile, idx) => {
          const levelInfo = getLevelInfo(profile.total_xp || 0);
          const stable = stables[profile.family_member_id];
          const horseEmoji = getHorseEmoji(stable?.horse_skin);
          const bonus = getTotalBonus(stable);
          return (
            <div key={profile.id} className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg">{horseEmoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{profile.family_member_name?.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">Lv.{levelInfo.level} · {profile.total_xp || 0} XP</p>
                {bonus > 0 && <p className="text-xs text-amber-600 font-bold">+{bonus}% gear</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}