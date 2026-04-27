import { useState, useEffect } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User, LogOut, Shield, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import BadgeDisplay from "../components/BadgeDisplay";
import SyncGoogleTasksButton from "../components/SyncGoogleTasksButton";
import { getEarnedBadges } from "@/utils/badges";
import MobileSelect from "../components/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/family", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeSetup, setHomeSetup] = useState(null);
  const [dayStartHour, setDayStartHour] = useState("0");
  const [savingHour, setSavingHour] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberColor, setNewMemberColor] = useState("blue");

  const colorMap = {
    blue: "bg-blue-500", green: "bg-green-500", purple: "bg-purple-500",
    orange: "bg-orange-500", pink: "bg-pink-500", teal: "bg-teal-500",
  };

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
        const members = await base44.entities.FamilyMember.list();
        setFamilyMembers(members);

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

  async function handleEditProfile() {
    setEditName(user.full_name || "");
    setEditOpen(true);
  }

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSavingName(true);
    await base44.auth.updateMe({ full_name: editName.trim() });
    setUser({ ...user, full_name: editName.trim() });
    setSavingName(false);
    setEditOpen(false);
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return;
    const created = await base44.entities.FamilyMember.create({ name: newMemberName.trim(), avatar_color: newMemberColor });
    setFamilyMembers(prev => [...prev, created]);
    setNewMemberName("");
    setMemberDialogOpen(false);
  }

  async function handleDeleteMember(id) {
    await base44.entities.FamilyMember.delete(id);
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  }

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
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleEditProfile} className="gap-1">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
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

      {/* Family Members */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-lg">Family Members</h3>
          <Button size="sm" variant="outline" onClick={() => setMemberDialogOpen(true)} className="gap-1">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {familyMembers.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground">No family members yet.</p>
            </div>
          )}
          {familyMembers.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 group">
              <div className={`w-9 h-9 rounded-full ${colorMap[m.avatar_color] || "bg-blue-500"} flex items-center justify-center text-white text-sm font-bold font-heading shrink-0`}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-heading font-semibold text-sm flex-1">{m.name}</span>
              <button
                onClick={() => handleDeleteMember(m.id)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Name</Label>
              <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Enter name" className="mt-1" onKeyDown={e => e.key === "Enter" && handleAddMember()} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Color</Label>
              <div className="flex gap-2 mt-2">
                {Object.entries(colorMap).map(([c, cls]) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full ${cls} transition-all ${newMemberColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-60 hover:opacity-100"}`}
                    onClick={() => setNewMemberColor(c)}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleAddMember} disabled={!newMemberName.trim()}>
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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