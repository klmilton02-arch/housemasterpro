import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardSummary() {
  const [profiles, setProfiles] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.GamificationProfile.list("-total_xp", 5),
      base44.entities.FamilyMember.list(),
    ]).then(([p, m]) => {
      setProfiles(p);
      setMembers(m);
    });
  }, []);

  if (profiles.length === 0) return null;

  const getMember = (id) => members.find(m => m.id === id);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-heading font-semibold text-sm text-foreground">Leaderboard</span>
        </div>
        <Link to="/leaderboard" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="space-y-2">
        {profiles.map((p, i) => {
          const member = getMember(p.family_member_id);
          const color = member?.avatar_color || "blue";
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-base w-5 text-center">{medals[i] || `${i + 1}`}</span>
              <div className={`w-6 h-6 rounded-full ${colorMap[color]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {p.family_member_name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm font-medium text-foreground flex-1 truncate">{p.family_member_name}</span>
              <span className="text-xs text-muted-foreground">Lv.{p.level}</span>
              <span className="text-xs font-semibold text-primary">{p.total_xp} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}