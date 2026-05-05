import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User, LogOut, Shield, Clock, Pencil, CalendarDays, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import BadgeDisplay from "../components/BadgeDisplay";
import { getEarnedBadges } from "@/utils/badges";
import MobileSelect from "../components/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStatusInfo } from "../components/TaskCard";
import AccountSetup from "../components/AccountSetup";

const colorMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  teal: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
};

export default function Profile() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);
  const { deleteAccount } = useAuth();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeSetup, setHomeSetup] = useState(null);
  const [dayStartHour, setDayStartHour] = useState("0");
  const [savingHour, setSavingHour] = useState(false);
  const [startDates, setStartDates] = useState({ cleaning: "", maintenance: "", bills: "", personal: "" });
  const [savingStartDates, setSavingStartDates] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [setupStep, setSetupStep] = useState("choose");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [resettingData, setResettingData] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      const [profiles, setups] = await Promise.all([
        me ? base44.entities.GamificationProfile.filter({ family_member_name: me.full_name }) : Promise.resolve([]),
        base44.entities.HomeSetup.list(),
      ]);

      if (profiles.length > 0) setProfile(profiles[0]);

      if (setups.length > 0) {
        const s = setups[0];
        setHomeSetup(s);
        setDayStartHour(String(s.day_start_hour ?? 0));
        setStartDates({
          cleaning: s.start_date_cleaning || "",
          maintenance: s.start_date_maintenance || "",
          bills: s.start_date_bills || "",
          personal: s.start_date_personal || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSavingName(true);
    await base44.auth.updateMe({ full_name: editName.trim() });
    setUser(prev => ({ ...prev, full_name: editName.trim() }));
    setSavingName(false);
    setEditOpen(false);
  }

  async function handleSaveStartDates() {
    setSavingStartDates(true);
    const data = {
      start_date_cleaning: startDates.cleaning || null,
      start_date_maintenance: startDates.maintenance || null,
      start_date_bills: startDates.bills || null,
      start_date_personal: startDates.personal || null,
    };
    if (homeSetup) {
      await base44.entities.HomeSetup.update(homeSetup.id, data);
    } else {
      const created = await base44.entities.HomeSetup.create(data);
      setHomeSetup(created);
    }
    setSavingStartDates(false);
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

  // Show onboarding if account type not yet set
  if (!user.account_type) {
    return <AccountSetup currentUser={user} onDone={loadData} initialStep={setupStep} />;
  }

  const earnedBadges = profile ? getEarnedBadges(profile) : [];

  return (
    <div className="min-h-screen bg-background p-6" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="max-w-[120rem] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Profile</h1>
        </div>

        {/* My Information */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setEditName(user.full_name || ""); setEditOpen(true); }} className="gap-1 shrink-0">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          </div>
        </div>

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Task Reset Time */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <div className="flex items-start gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">New Day Starts At</p>
              </div>
            </div>
            <div className="space-y-2">
              <MobileSelect
                value={dayStartHour}
                onValueChange={setDayStartHour}
                title="Select time"
                triggerClassName="w-full"
                options={Array.from({ length: 24 }, (_, i) => ({
                  value: String(i),
                  label: i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`
                }))}
              />
              <Button onClick={handleSaveDayStart} disabled={savingHour} size="sm" className="w-full">
                {savingHour ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Start Dates */}
          <Link to="/task-start-dates" className="block">
            <div className="bg-card rounded-lg border border-border shadow-sm p-4 h-full hover:shadow-md transition-shadow">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">Task Start Dates</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Set when each task type begins</p>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground mt-2">
                <ChevronRight className="w-4 h-4 ml-auto" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Link to="/presets" className="block">
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📋</span>
                <p className="font-semibold text-sm text-foreground">Presets</p>
              </div>
              <p className="text-xs text-muted-foreground">Browse task templates</p>
            </div>
          </Link>
          <Link to="/family" className="block">
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
                <p className="font-semibold text-sm text-foreground">Family</p>
              </div>
              <p className="text-xs text-muted-foreground">Manage members</p>
            </div>
          </Link>
          <Link to="/home-setup" className="block">
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏠</span>
                <p className="font-semibold text-sm text-foreground">Home Setup</p>
              </div>
              <p className="text-xs text-muted-foreground">Configure your home</p>
            </div>
          </Link>
        </div>

        {/* Security & Sign Out */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Link to="/encryption" className="block">
            <Button variant="outline" className="w-full gap-2 h-auto py-2 px-3 justify-start text-sm">
              <Shield className="w-4 h-4" />
              <span>Security & Privacy</span>
            </Button>
          </Link>
          <Button onClick={() => base44.auth.logout("/")} variant="outline" className="gap-2 h-auto py-2 px-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Data Management Section */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Data Management</p>
          <div className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-amber-700 hover:bg-amber-50">
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                  <AlertDialogDescription>This will delete all your tasks and reset your XP, level, and badges to start fresh. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={resettingData}>Cancel</AlertDialogCancel>
                  <Button
                    onClick={async () => {
                      setResettingData(true);
                      try {
                        await base44.functions.invoke('fullReset', {});
                        loadData();
                        setResettingData(false);
                      } catch (error) {
                        console.error("Failed to reset data:", error);
                        setResettingData(false);
                      }
                    }}
                    disabled={resettingData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resettingData ? "Resetting..." : "Reset Data"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={deleteError ? true : undefined}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50">
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete your account and all associated data. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAccount} onClick={() => setDeleteError("")}>Cancel</AlertDialogCancel>
                  <Button
                    onClick={async () => {
                      setDeletingAccount(true);
                      setDeleteError("");
                      try {
                        await deleteAccount();
                      } catch (error) {
                        setDeleteError(error.message || "Failed to delete account. Please try again.");
                        setDeletingAccount(false);
                      }
                    }}
                    disabled={deletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Display Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
            <Button className="w-full" onClick={handleSaveName} disabled={savingName || !editName.trim()}>
              {savingName ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}