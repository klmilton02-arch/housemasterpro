import { useState, useEffect } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User, LogOut, Shield, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BadgeDisplay from "../components/BadgeDisplay";
import SyncGoogleTasksButton from "../components/SyncGoogleTasksButton";
import { getEarnedBadges } from "@/utils/badges";
import MobileSelect from "../components/MobileSelect";

export default function Profile() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/family", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeSetup, setHomeSetup] = useState(null);
  const [dayStartHour, setDayStartHour] = useState("0");
  const [savingHour, setSavingHour] = useState(false);
  const [clearing, setClearing] = useState(false);

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
        const setups = await base44.entities.HomeSetup.list();
        if (setups.length > 0) {
          setHomeSetup(setups[0]);
          setDayStartHour(String(setups[0].day_start_hour ?? 0));
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

  async function handleSaveDayStart() {
    setSavingHour(true);
    const hour = parseInt(dayStartHour);
    if (homeSetup) {
      await base44.entities.HomeSetup.update(homeSetup.id, { day_start_hour: hour });
    } else {
      const created = await base44.entities.HomeSetup.create({ day_start_hour: hour });
      setHomeSetup(created);
    }
    setSavingHour(false);
  }

  async function handleStartOver() {
    setClearing(true);
    try {
      const allTasks = await base44.entities.Task.list("-created_date", 1000);
      await Promise.all(allTasks.map(task => base44.entities.Task.delete(task.id)));
    } catch (err) {
      console.error("Failed to delete tasks:", err);
    } finally {
      setClearing(false);
    }
  }

  async function handleClearLeaderboard() {
    setClearing(true);
    try {
      const profiles = await base44.entities.GamificationProfile.list("-created_date", 1000);
      const completions = await base44.entities.CompletionHistory.list("-created_date", 1000);
      await Promise.all([
        ...profiles.map(p => base44.entities.GamificationProfile.delete(p.id)),
        ...completions.map(c => base44.entities.CompletionHistory.delete(c.id))
      ]);
    } catch (err) {
      console.error("Failed to clear leaderboard:", err);
    } finally {
      setClearing(false);
    }
  }

  async function handleStartFresh() {
    setClearing(true);
    try {
      const allTasks = await base44.entities.Task.list("-created_date", 1000);
      const completedTasks = allTasks.filter(t => t.status === "Completed");
      const today = new Date().toISOString().split("T")[0];
      await Promise.all(completedTasks.map(task =>
        base44.entities.Task.update(task.id, {
          status: "Pending",
          last_completed_date: null,
          next_due_date: today,
          streak: 0
        })
      ));
    } catch (err) {
      console.error("Failed to reset completed tasks:", err);
    } finally {
      setClearing(false);
    }
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
          <h1 className="font-heading text-3xl font-bold">Profile</h1>
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

      {/* Day Start Setting */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-lg">Task Reset Time</h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">New day starts at</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed tasks reset to Pending at this hour each day</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MobileSelect
              value={dayStartHour}
              onValueChange={setDayStartHour}
              title="Select time"
              triggerClassName="flex-1"
              options={Array.from({ length: 24 }, (_, i) => ({
                value: String(i),
                label: i === 0 ? "12:00 AM (Midnight)" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM (Noon)" : `${i - 12}:00 PM`
              }))}
            />
            <Button onClick={handleSaveDayStart} disabled={savingHour} size="sm">
              {savingHour ? "Saving..." : "Save"}
            </Button>
          </div>
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

      {/* Start Over */}
      <div className="space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:bg-yellow-50">
              <Trash2 className="w-4 h-4" /> Start Fresh
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Completed Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark all your completed tasks as pending with today's due date. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartFresh} disabled={clearing} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                {clearing ? "Resetting..." : "Start Fresh"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50">
              <Trash2 className="w-4 h-4" /> Delete All Tasks
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all tasks. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartOver} disabled={clearing} className="bg-destructive text-destructive-foreground">
                {clearing ? "Deleting..." : "Delete All Tasks"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Clear Leaderboard
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Leaderboard</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all XP, levels, badges, and completion history for all players. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearLeaderboard} disabled={clearing} className="bg-destructive text-destructive-foreground">
                {clearing ? "Clearing..." : "Clear Leaderboard"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Logout */}
      <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}