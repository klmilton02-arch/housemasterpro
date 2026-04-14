import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo, ACHIEVEMENT_BADGES } from "@/utils/gamification";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { startOfWeek, startOfMonth, parseISO, isAfter } from "date-fns";
import HorseRace from "@/components/HorseRace";

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-orange-600"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

function ProfileRow({ rank, profile, xp }) {
  const levelInfo = getLevelInfo(xp);
  const badges = (profile.badges || []);
  return (
    <div className={`bg-card border border-border rounded-xl p-4 flex items-center gap-4 ${rank === 0 ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20" : ""}`}>
      <div className="text-2xl w-8 text-center">{RANK_ICONS[rank] || `#${rank + 1}`}</div>
      <div className={`w-10 h-10 rounded-full bg-${profile.avatar_color || "blue"}-100 flex items-center justify-center font-heading font-bold text-${profile.avatar_color || "blue"}-700 text-sm shrink-0`}>
        {(profile.family_member_name || "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">{profile.family_member_name}</p>
          <p className={`font-heading font-bold text-lg ${RANK_COLORS[rank] || "text-foreground"}`}>{xp} XP</p>
        </div>
        <p className="text-xs text-muted-foreground">Lv.{levelInfo.level} · {levelInfo.title}</p>
        <Progress value={levelInfo.progress} className="h-1.5 mt-1.5" />
        {badges.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {badges.map(bid => {
              const b = ACHIEVEMENT_BADGES.find(a => a.id === bid);
              return b ? (
                <span key={bid} title={b.name} className="text-sm">{b.emoji}</span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [profiles, setProfiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.GamificationProfile.list("-total_xp", 50),
      base44.entities.CompletionHistory.list("-completed_date", 500),
    ]).then(([p, h]) => {
      setProfiles(p);
      setHistory(h);
      setLoading(false);
    });
  }, []);

  function getWeeklyXP(memberId) {
    const since = startOfWeek(new Date(), { weekStartsOn: 1 });
    return history
      .filter(h => h.family_member_id === memberId && isAfter(parseISO(h.completed_date), since))
      .reduce((sum, h) => sum + (h.points_earned || 0), 0);
  }

  function getMonthlyXP(memberId) {
    const since = startOfMonth(new Date());
    return history
      .filter(h => h.family_member_id === memberId && isAfter(parseISO(h.completed_date), since))
      .reduce((sum, h) => sum + (h.points_earned || 0), 0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="space-y-6 max-w-xs mx-auto px-1 pt-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Family rankings</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">No points earned yet. Complete tasks to get on the board!</p>
        </div>
      </div>
    );
  }

  const allTimeSorted = [...profiles].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
  const weeklySorted = [...profiles].sort((a, b) => getWeeklyXP(b.family_member_id) - getWeeklyXP(a.family_member_id));
  const monthlySorted = [...profiles].sort((a, b) => getMonthlyXP(b.family_member_id) - getMonthlyXP(a.family_member_id));

  return (
    <div className="space-y-6 max-w-xs mx-auto px-1 pt-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Family rankings</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">🏇 Horse Race</h2>
          <Link to="/stable" className="text-xs text-primary font-medium hover:underline">⚙️ My Stable →</Link>
        </div>
        <HorseRace />
      </div>

      <Tabs defaultValue="alltime">
        <TabsList className="w-full">
          <TabsTrigger value="alltime" className="flex-1">All Time</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">This Month</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="alltime" className="mt-4 space-y-3">
          {allTimeSorted.map((p, i) => (
            <ProfileRow key={p.id} rank={i} profile={p} xp={p.total_xp || 0} />
          ))}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-3">
          {monthlySorted.map((p, i) => (
            <ProfileRow key={p.id} rank={i} profile={p} xp={getMonthlyXP(p.family_member_id)} />
          ))}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-3">
          {weeklySorted.map((p, i) => (
            <ProfileRow key={p.id} rank={i} profile={p} xp={getWeeklyXP(p.family_member_id)} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}