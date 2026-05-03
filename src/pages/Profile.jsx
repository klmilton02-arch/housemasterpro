import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User, LogOut, Shield, Clock, Pencil, CalendarDays } from "lucide-react";
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
    <div className="space-y-7 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7 pb-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      <h1 className="font-heading text-3xl font-bold">Profile</h1>

      {/* My Information */}
      <div className="bg-violet-50 border border-violet-100 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground">{user.full_name}</h2>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setEditName(user.full_name || ""); setEditOpen(true); }} className="gap-1 flex-shrink-0">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          </div>
        </div>
      {/* Start Dates */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-lg">Task Start Dates</h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3 mb-1">
            <CalendarDays className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Set the start date for each task type. New tasks of that type will start from this date.</p>
          </div>
          {[
            { key: "cleaning", label: "Cleaning" },
            { key: "maintenance", label: "Maintenance" },
            { key: "bills", label: "Bills" },
            { key: "personal", label: "Personal" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-sm font-medium w-28 shrink-0">{label}</label>
              <input
                type="date"
                value={startDates[key]}
                onChange={e => setStartDates(prev => ({ ...prev, [key]: e.target.value }))}
                className="flex-1 border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
              />
              {startDates[key] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStartDates(prev => ({ ...prev, [key]: "" }))}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear
                </Button>
              )}
            </div>
          ))}
          <Button onClick={handleSaveStartDates} disabled={savingStartDates} size="sm" className="w-full">
            {savingStartDates ? "Saving..." : "Save Start Dates"}
          </Button>
        </div>
      </div>

      {/* Task Reset Time */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-lg">Task Reset Time</h3>
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
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

      {/* Info Links */}
      <div className="space-y-2">
        <Link to="/encryption">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Shield className="w-4 h-4" /> Encryption & Security
          </Button>
        </Link>
      </div>

      {/* Danger Zone */}
      <div className="pt-2 border-t border-border space-y-2">
        <Button onClick={() => base44.auth.logout("/")} variant="destructive" className="w-full gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-sm text-destructive border-destructive/30 hover:bg-destructive/10">
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
            <Button variant="outline" className="w-full text-sm text-destructive border-destructive/30 hover:bg-destructive/10">
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