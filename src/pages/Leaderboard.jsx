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
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <p className="text-sm text-blue-500 font-medium">Your Progress · Level {userProfile.level}</p>
              <div className="flex items-baseline gap-1">
                <p className="font-heading font-bold text-2xl text-blue-600">{userProfile.total_xp}</p>
                <p className="text-base text-blue-400">XP</p>
              </div>
            </div>
            <StreakCircle streak={userProfile.cleaning_streak || 0} size="sm" />
          </div>
          <Link to="/cats" className="bg-pink-100 text-pink-800 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-pink-200 transition-colors flex items-center gap-1.5 shrink-0">
            🐱 My Cats
          </Link>
        </div>
      )}

      <h2 className="font-heading text-2xl font-bold">Leaderboard</h2>

      {(() => {
        // Get current user's family group
        const currentUser = users.find(u => u.email === userProfile?.created_by);
        const familyGroupId = currentUser?.family_group_id;
        
        // Show only users from the family group
        const allEntries = users
          .filter(u => u.family_group_id === familyGroupId)
          .map(u => {
            const profile = profiles.find(p => p.family_member_name === u.full_name);
            return {
              id: u.id,
              name: u.full_name,
              avatar_color: "blue",
              total_xp: profile?.total_xp || 0,
              level: profile?.level || 1,
            };
          })
          .sort((a, b) => b.total_xp - a.total_xp);

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