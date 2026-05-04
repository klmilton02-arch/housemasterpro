import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { base44 } from "@/api/base44Client";
import { Users } from "lucide-react";

export default function Family() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [user, setUser] = useState(null);
  const [familyUsers, setFamilyUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      if (me?.family_group_id) {
        const allUsers = await base44.entities.User.list();
        setFamilyUsers(allUsers.filter(u => u.family_group_id === me.family_group_id));
      }
    } catch (err) {
      console.error("Failed to load family data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7 pb-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <h1 className="font-heading text-3xl font-bold">Family</h1>

      {familyUsers.length > 0 ? (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {familyUsers.map(member => (
              <div key={member.id} className="px-4 py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded inline-block">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">No family members yet</p>
        </div>
      )}
    </div>
  );
}