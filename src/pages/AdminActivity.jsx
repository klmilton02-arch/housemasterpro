import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Activity, Trophy, CheckCircle2, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return format(date, "MMM d, yyyy");
}

export default function AdminActivity() {
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      setUnauthorized(true);
      setRefreshing(false);
      setLoading(false);
      return;
    }

    const [usersRes, profilesRes, completionsRes] = await Promise.all([
      base44.entities.User.list("-created_date", 200),
      base44.entities.GamificationProfile.list("-updated_date", 200),
      base44.entities.CompletionHistory.list("-completed_date", 500),
    ]);

    setUsers(usersRes || []);
    setProfiles(profilesRes || []);
    setCompletions(completionsRes || []);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (unauthorized) return (
    <div className="flex items-center justify-center min-h-screen text-center px-4">
      <div>
        <h2 className="font-heading text-xl font-bold mb-2">Admin Only</h2>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    </div>
  );

  // Build per-user activity summary
  const profileMap = {};
  profiles.forEach(p => { profileMap[p.user_id] = p; });

  const completionsByUser = {};
  completions.forEach(c => {
    if (!completionsByUser[c.created_by_id]) completionsByUser[c.created_by_id] = [];
    completionsByUser[c.created_by_id].push(c);
  });

  const userRows = users.map(u => {
    const profile = profileMap[u.id];
    const userCompletions = completionsByUser[u.id] || [];
    const lastCompletion = userCompletions[0]; // already sorted by -completed_date
    const lastActivity = lastCompletion?.completed_date
      ? (profile?.updated_date && new Date(profile.updated_date) > new Date(lastCompletion.completed_date)
          ? profile?.updated_date
          : lastCompletion.completed_date)
      : profile?.updated_date || u.created_date;

    return {
      ...u,
      totalXP: profile?.total_xp || 0,
      level: profile?.level || 1,
      totalCompletions: userCompletions.length,
      lastActivity,
      lastCompletionDate: lastCompletion?.completed_date,
      familyGroupId: profile?.family_group_id,
    };
  }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold">User Activity</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading text-2xl font-bold text-primary">{users.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Users</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading text-2xl font-bold text-primary">{completions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Completions</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-heading text-2xl font-bold text-primary">
            {userRows.filter(u => {
              if (!u.lastActivity) return false;
              const diff = new Date() - new Date(u.lastActivity);
              return diff < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Active (7 days)</p>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Users — sorted by last activity</span>
        </div>
        <div className="divide-y divide-border">
          {userRows.map(u => (
            <div key={u.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-muted/30 transition-colors">
              {/* Name + Email */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>

              {/* Role */}
              <div className="shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                  {u.role || "user"}
                </span>
              </div>

              {/* XP / Level */}
              <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Lv {u.level} · {u.totalXP.toLocaleString()} XP</span>
              </div>

              {/* Completions */}
              <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>{u.totalCompletions} tasks</span>
              </div>

              {/* Joined */}
              <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {u.created_date ? format(new Date(u.created_date), "MMM d, yyyy") : "—"}</span>
              </div>

              {/* Last Activity */}
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-foreground">{timeAgo(u.lastActivity)}</p>
                <p className="text-xs text-muted-foreground">last active</p>
              </div>
            </div>
          ))}
          {userRows.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">No users found.</div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="font-medium text-sm">Recent Task Completions</span>
        </div>
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {completions.slice(0, 50).map((c, i) => (
            <div key={c.id || i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.task_name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.family_member_name || "—"}</p>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">{c.points_earned} XP</div>
              <div className="shrink-0 text-xs text-muted-foreground">{c.completed_date ? format(new Date(c.completed_date), "MMM d") : "—"}</div>
            </div>
          ))}
          {completions.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">No completions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}