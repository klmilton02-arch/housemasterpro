import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal } from "lucide-react";

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [profiles, setProfiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.GamificationProfile.list("-total_xp", 100),
      base44.entities.FamilyMember.list(),
    ]).then(([p, m]) => {
      setProfiles(p);
      setMembers(m);
      setLoading(false);
    });
  }, []);

  const getMember = (id) => members.find(m => m.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-sm md:max-w-2xl mx-auto px-4 sm:px-4 pt-6">
      <h1 className="font-heading text-3xl font-bold">Leaderboard</h1>

      {profiles.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No players yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="space-y-0">
            {profiles.map((p, i) => {
              const member = getMember(p.family_member_id);
              const color = member?.avatar_color || "blue";
              const isMedal = i < 3;
              
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 ${
                    isMedal ? "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20" : ""
                  }`}
                >
                  <div className="w-10 text-center">
                    <span className={`text-2xl font-bold ${isMedal ? "block" : "hidden"}`}>{medals[i]}</span>
                    <span className={`text-sm font-semibold text-muted-foreground ${isMedal ? "hidden" : "block"}`}>#{i + 1}</span>
                  </div>
                  
                  <div className={`w-10 h-10 rounded-full ${colorMap[color]} flex items-center justify-center text-white font-bold shrink-0`}>
                    {p.family_member_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground truncate">{p.family_member_name}</p>
                    <p className="text-xs text-muted-foreground">Level {p.level}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-lg text-primary">{p.total_xp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}