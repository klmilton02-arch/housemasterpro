import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import BadgeDisplay from "../components/BadgeDisplay";
import SyncGoogleTasksButton from "../components/SyncGoogleTasksButton";
import { getEarnedBadges } from "@/utils/badges";

export default function Profile() {
  const navigate = useNavigate();
  const touchStartX = useRef(null);
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff < -60) navigate("/home-setup");  // swipe right → home-setup
    else if (diff > 60) navigate("/dashboard"); // swipe left → dashboard
    touchStartX.current = null;
  }

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        
        if (me) {
          const profiles = await base44.entities.GamificationProfile.filter({
            family_member_name: me.full_name
          });
          if (profiles.length > 0) {
            setProfile(profiles[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleLogout() {
    await base44.auth.logout("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Not signed in</p>
      </div>
    );
  }

  const earnedBadges = profile ? getEarnedBadges(profile) : [];

  return (
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7 pb-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* User Info */}
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Profile</h1>
          <p className="text-base sm:text-sm text-muted-foreground mt-1">Your account and achievements</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {profile && (
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg">Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="font-heading font-bold text-2xl text-primary mt-1">{profile.level}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total XP</p>
              <p className="font-heading font-bold text-2xl text-accent mt-1">{profile.total_xp}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Completions</p>
              <p className="font-heading font-bold text-2xl text-blue-600 mt-1">{profile.total_completions}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Badges</p>
              <p className="font-heading font-bold text-2xl text-orange-600 mt-1">{earnedBadges.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-lg">Badges & Achievements</h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <BadgeDisplay badges={earnedBadges} size="md" />
        </div>
      </div>

      {/* Google Tasks Sync */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-lg">Integrations</h3>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Google Tasks</p>
            <p className="text-xs text-muted-foreground">Sync upcoming maintenance tasks to your to-do list</p>
          </div>
          <SyncGoogleTasksButton />
        </div>
      </div>

      {/* Info Links */}
      <div className="space-y-2">
        <Link to="/encryption">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Shield className="w-4 h-4" /> Encryption & Security
          </Button>
        </Link>
      </div>

      {/* Logout */}
      <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}