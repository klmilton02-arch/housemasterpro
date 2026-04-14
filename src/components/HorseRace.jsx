import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "@/utils/gamification";

const HORSE_EMOJIS = ["🐴", "🦄", "🐎", "🏇", "🐴", "🦄"];

const HORSE_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

// Oval track parameters (normalized 0-1 space, will be scaled by SVG viewBox)
const CX = 200;
const CY = 160;
const RX = 155; // horizontal radius (outer)
const RY = 100; // vertical radius (outer)
const TRACK_WIDTH = 36;

// Get x,y point on the ellipse at angle t (0 = right, goes clockwise)
function ellipsePoint(cx, cy, rx, ry, t) {
  return {
    x: cx + rx * Math.cos(t),
    y: cy + ry * Math.sin(t),
  };
}

// Get a point on a lane (offset inward from outer edge)
function lanePoint(laneOffset, t) {
  const r = (laneOffset + 0.5) / 1; // normalized 0-1 across track width
  const rx = RX - r * TRACK_WIDTH + TRACK_WIDTH / 2;
  const ry = RY - r * TRACK_WIDTH + TRACK_WIDTH / 2;
  return ellipsePoint(CX, CY, rx, ry, t);
}

export default function HorseRace() {
  const [profiles, setProfiles] = useState([]);
  const [angles, setAngles] = useState({});   // angle in radians for each horse (0 → 2π = one lap)
  const [racing, setRacing] = useState(false);
  const [winner, setWinner] = useState(null);
  const animRef = useRef(null);
  const speedsRef = useRef({});
  const finishRef = useRef([]);
  const racingRef = useRef(false);

  useEffect(() => {
    base44.entities.GamificationProfile.list("-total_xp", 6).then(p => {
      setProfiles(p);
      const init = {};
      p.forEach(prof => { init[prof.id] = Math.PI / 2; }); // start at bottom of oval
      setAngles(init);
    });
  }, []);

  function startRace() {
    if (racingRef.current) return;

    setWinner(null);
    finishRef.current = [];
    racingRef.current = true;
    setRacing(true);

    // Reset angles to start position (bottom of oval)
    const init = {};
    profiles.forEach(p => { init[p.id] = Math.PI / 2; });
    setAngles(init);

    const maxXP = Math.max(...profiles.map(p => p.total_xp || 1), 1);
    profiles.forEach(p => {
      const xpFactor = ((p.total_xp || 0) / maxXP) * 0.4 + 0.6;
      speedsRef.current[p.id] = xpFactor * (0.012 + Math.random() * 0.008);
    });

    // Track how much each horse has traveled (in radians from start)
    const traveled = {};
    profiles.forEach(p => { traveled[p.id] = 0; });

    function animate() {
      setAngles(prev => {
        const next = { ...prev };
        let allDone = true;

        profiles.forEach(p => {
          if (traveled[p.id] < Math.PI * 2) {
            allDone = false;
            const step = speedsRef.current[p.id];
            traveled[p.id] += step;
            next[p.id] = Math.PI / 2 + traveled[p.id]; // clockwise from bottom
            
            if (traveled[p.id] >= Math.PI * 2 && !finishRef.current.includes(p.id)) {
              finishRef.current.push(p.id);
              if (finishRef.current.length === 1) {
                setWinner(p);
              }
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

  // Build the SVG ellipse path for inner/outer edges
  function ellipsePath(rx, ry) {
    return `M ${CX + rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX - rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX + rx} ${CY} Z`;
  }

  // Finish line: a radial line at angle π/2 (bottom), going across track width
  const finishAngle = Math.PI / 2;
  const finishOuter = ellipsePoint(CX, CY, RX, RY, finishAngle);
  const finishInner = ellipsePoint(CX, CY, RX - TRACK_WIDTH, RY - TRACK_WIDTH, finishAngle);

  return (
    <div className="space-y-4">
      {/* Oval Track SVG */}
      <div className="relative w-full rounded-xl overflow-hidden bg-green-800 dark:bg-green-950 p-2">
        <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 300 }}>
          {/* Grass background */}
          <ellipse cx={CX} cy={CY} rx={RX + 20} ry={RY + 20} fill="#15803d" opacity="0.6" />

          {/* Track surface */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#c2a06e" />

          {/* Inner grass */}
          <ellipse cx={CX} cy={CY} rx={RX - TRACK_WIDTH} ry={RY - TRACK_WIDTH} fill="#16a34a" />

          {/* Lane dividers */}
          {Array.from({ length: numLanes - 1 }).map((_, i) => {
            const r = ((i + 1) / numLanes);
            const lrx = RX - r * TRACK_WIDTH;
            const lry = RY - r * TRACK_WIDTH;
            return (
              <ellipse
                key={i}
                cx={CX} cy={CY}
                rx={lrx} ry={lry}
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                strokeDasharray="6 4"
                opacity="0.5"
              />
            );
          })}

          {/* Track border lines */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="white" strokeWidth="1.5" />
          <ellipse cx={CX} cy={CY} rx={RX - TRACK_WIDTH} ry={RY - TRACK_WIDTH} fill="none" stroke="white" strokeWidth="1.5" />

          {/* Finish line */}
          {(() => {
            const segments = 6;
            const lines = [];
            for (let i = 0; i < segments; i++) {
              const t0 = finishAngle - 0.01 + (i / segments) * 0.02;
              const t1 = finishAngle - 0.01 + ((i + 1) / segments) * 0.02;
              const innerR = RX - TRACK_WIDTH;
              const innerRY = RY - TRACK_WIDTH;
              const frac0 = i / segments;
              const frac1 = (i + 1) / segments;
              const x1 = CX + (innerR + frac0 * TRACK_WIDTH) * Math.cos(finishAngle);
              const y1 = CY + (innerRY + frac0 * TRACK_WIDTH) * Math.sin(finishAngle);
              const x2 = CX + (innerR + frac1 * TRACK_WIDTH) * Math.cos(finishAngle);
              const y2 = CY + (innerRY + frac1 * TRACK_WIDTH) * Math.sin(finishAngle);
              lines.push(
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={i % 2 === 0 ? "white" : "black"} strokeWidth="4" />
              );
            }
            return lines;
          })()}

          {/* START label */}
          <text
            x={CX + (RX - TRACK_WIDTH / 2) * Math.cos(finishAngle) + 14}
            y={CY + (RY - TRACK_WIDTH / 2) * Math.sin(finishAngle) + 4}
            fontSize="8" fill="white" fontWeight="bold" textAnchor="middle"
          >
            START
          </text>

          {/* Horses */}
          {profiles.map((profile, idx) => {
            const angle = angles[profile.id] ?? (Math.PI / 2);
            const laneIndex = idx;
            const laneRatio = (laneIndex + 0.5) / numLanes;
            const horseRX = RX - laneRatio * TRACK_WIDTH;
            const horseRY = RY - laneRatio * TRACK_WIDTH;
            const pos = ellipsePoint(CX, CY, horseRX, horseRY, angle);
            const isFirst = finishRef.current[0] === profile.id;

            return (
              <g key={profile.id}>
                {/* Shadow */}
                <ellipse cx={pos.x + 1} cy={pos.y + 2} rx={9} ry={5} fill="black" opacity="0.2" />
                {/* Horse emoji via foreignObject */}
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  fontSize="18"
                  textAnchor="middle"
                  dominantBaseline="auto"
                  style={{ userSelect: "none" }}
                >
                  {HORSE_EMOJIS[idx % HORSE_EMOJIS.length]}
                </text>
                {/* Name tag */}
                <text
                  x={pos.x}
                  y={pos.y - 12}
                  fontSize="7"
                  textAnchor="middle"
                  fill="white"
                  fontWeight="bold"
                  style={{ textShadow: "0 1px 2px black" }}
                  paintOrder="stroke"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  {profile.family_member_name?.split(" ")[0]}
                </text>
                {/* Winner crown */}
                {isFirst && !racing && (
                  <text x={pos.x} y={pos.y - 22} fontSize="10" textAnchor="middle">👑</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend overlay */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
          {profiles.map((profile, idx) => (
            <div key={profile.id} className="flex items-center gap-1">
              <span className="text-xs">{HORSE_EMOJIS[idx % HORSE_EMOJIS.length]}</span>
              <span className="text-xs text-white font-medium drop-shadow">
                {profile.family_member_name?.split(" ")[0]}
              </span>
            </div>
          ))}
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
    </div>
  );
}