import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Zap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import StreakCircle from "../components/StreakCircle";

const colorMap = {
  blue: "bg-blue-200 text-blue-700",
  green: "bg-green-200 text-green-700",
  purple: "bg-purple-200 text-purple-700",
  orange: "bg-orange-200 text-orange-700",
  pink: "bg-pink-200 text-pink-700",
  teal: "bg-teal-200 text-teal-700",
};

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [profiles, setProfiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.GamificationProfile.list("-total_xp", 100),
      base44.entities.FamilyMember.list(),
      base44.auth.me(),
      base44.entities.User.list(),
    ]).then(([p, m, user, allUsers]) => {
      setProfiles(p);
      setMembers(m);
      setUsers(allUsers || []);
      if (user) {
        const myProfile = p.find(prof => prof.family_member_name === user.full_name);
        setUserProfile(myProfile);
      }
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
      <h1 className="font-heading text-3xl font-bold">Rewards</h1>

      {userProfile && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-amber-600 mb-2">Your Progress</p>
              <div className="flex items-baseline gap-2">
                <p className="font-heading font-bold text-3xl text-amber-600">{userProfile.total_xp}</p>
                <p className="text-amber-500">XP</p>
              </div>
              <p className="text-xs text-amber-500 mt-1">Level {userProfile.level}</p>
            </div>
            <div className="flex items-center gap-3">
              <StreakCircle streak={userProfile.cleaning_streak || 0} size="md" />
              <Zap className="w-12 h-12 text-amber-400" />
            </div>
          </div>
          <Link to="/stable" className="block bg-violet-200 text-violet-900 rounded-lg p-3 text-center font-semibold hover:bg-violet-300 transition-colors">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Visit Stable
            </div>
          </Link>
        </div>
      )}

      <h2 className="font-heading text-2xl font-bold">Leaderboard</h2>

      {(() => {
        // Combine family members and users from the family group
        const familyGroupId = userProfile?.family_group_id || users.find(u => u.family_group_id)?.family_group_id;
        
        const allEntries = [
          ...members.map(m => {
            const profile = profiles.find(p => p.family_member_id === m.id);
            return {
              id: m.id,
              name: m.name,
              avatar_color: m.avatar_color,
              total_xp: profile?.total_xp || 0,
              level: profile?.level || 1,
            };
          }),
          ...users
            .filter(u => u.family_group_id === familyGroupId && !members.some(m => m.name === u.full_name))
            .map(u => {
              const profile = profiles.find(p => p.family_member_name === u.full_name);
              return {
                id: u.id,
                name: u.full_name,
                avatar_color: "blue",
                total_xp: profile?.total_xp || 0,
                level: profile?.level || 1,
              };
            }),
        ].sort((a, b) => b.total_xp - a.total_xp);

        if (allEntries.length === 0) return (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">No players yet.</p>
          </div>
        );

        return (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="space-y-0">
            {allEntries.map((p, i) => {
              const color = p.avatar_color || "blue";
              const isMedal = i < 3;
              
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 ${
                  i === 0 ? "bg-amber-50" : i === 1 ? "bg-slate-50" : i === 2 ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="w-10 text-center">
                    <span className={`text-2xl font-bold ${isMedal ? "block" : "hidden"}`}>{medals[i]}</span>
                    <span className={`text-sm font-semibold text-muted-foreground ${isMedal ? "hidden" : "block"}`}>#{i + 1}</span>
                  </div>
                  
                  <div className={`w-10 h-10 rounded-full ${colorMap[color] || "bg-blue-200 text-blue-700"} flex items-center justify-center font-bold shrink-0`}>
                    {p.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Level {p.level}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-lg text-amber-600">{p.total_xp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}
    </div>
  );
}