import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  useEffect(() => {
    // Call backend function to bypass client-side caching
    base44.functions.invoke('getLeaderboardProfiles', {}).then((res) => {
      const { profiles, members, users } = res.data;
      setProfiles(profiles);
      setMembers(members);
      setUsers(users || []);
      
      base44.auth.me().then(user => {
        if (user) {
          // Match by user ID (family_member_id), linked user, or name
          const myMember = members.find(m => m.linked_user_id === user.id || m.linked_user_email === user.email);
          const myProfile = profiles.find(prof =>
            prof.family_member_id === user.id ||
            (myMember && (prof.family_member_id === myMember.id || prof.family_member_name === myMember.name))
          );
          setUserProfile(myProfile);
        }
        setLoading(false);
      });
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
        // Get current user's family group from any user in the list who shares the group
        const familyGroupId = members[0]?.family_group_id || profiles[0]?.family_group_id;
        
        // Show all family members from the family group
        const allEntries = members
          .filter(m => m.family_group_id === familyGroupId)
          .map(m => {
            // Match profile by: family_member_id == member.id, OR family_member_id == linked_user_id, OR name match
            const profile = profiles.find(p =>
              p.family_member_id === m.id ||
              (m.linked_user_id && p.family_member_id === m.linked_user_id) ||
              p.family_member_name === m.name
            );
            return {
              id: m.id,
              name: m.name,
              avatar_color: m.avatar_color || "blue",
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
          <div className="space-y-3">
            {allEntries.map((p, i) => {
              const color = p.avatar_color || "blue";
              const isMedal = i < 3;
              const bgColor = i === 0 ? "bg-amber-50 border-amber-200" : i === 1 ? "bg-slate-50 border-slate-200" : i === 2 ? "bg-orange-50 border-orange-200" : "bg-card border-border";

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${bgColor}`}
                >
                  <div className="w-10 text-center shrink-0">
                    {isMedal
                      ? <span className="text-2xl">{medals[i]}</span>
                      : <span className="text-sm font-semibold text-muted-foreground">#{i + 1}</span>
                    }
                  </div>

                  <div className={`w-12 h-12 rounded-full ${colorMap[color] || "bg-blue-200 text-blue-700"} flex items-center justify-center font-bold text-lg shrink-0`}>
                    {p.name?.[0]?.toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-lg text-foreground truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Level {p.level}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-2xl text-amber-600">{p.total_xp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}