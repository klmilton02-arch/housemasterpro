import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Copy, Check, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export default function Family() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/family", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [members, setMembers] = useState([]);
  const [familyUsers, setFamilyUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [familyGroup, setFamilyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [copied, setCopied] = useState(false);
  const [setupStep, setSetupStep] = useState("choose");
  const { deleteAccount } = useAuth();

  const loadData = useCallback(async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);

    const [m, t, allUsers] = await Promise.all([
      base44.entities.FamilyMember.list(),
      base44.entities.Task.list("-created_date", 500),
      base44.entities.User.list(),
    ]);
    setMembers(m);
    setTasks(t);

    if (user?.family_group_id) {
      const groups = await base44.entities.FamilyGroup.filter({ id: user.family_group_id });
      if (groups.length > 0) setFamilyGroup(groups[0]);
      // Filter users who belong to the same family group
      const fUsers = allUsers.filter(u => u.family_group_id === user.family_group_id);
      setFamilyUsers(fUsers);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAdd() {
    if (!name.trim()) return;
    await base44.entities.FamilyMember.create({ name: name.trim(), avatar_color: color });
    setName("");
    setDialogOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    await base44.entities.FamilyMember.delete(id);
    loadData();
  }

  async function handleLeaveFamily() {
    await base44.auth.updateMe({ account_type: "solo", family_group_id: "" });
    setFamilyGroup(null);
    loadData();
  }

  async function handleJoinFamily() {
    setSetupStep("family-choice");
    await base44.auth.updateMe({ account_type: null });
    loadData();
  }

  function copyCode() {
    navigator.clipboard.writeText(familyGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getMemberStats(memberId) {
    const memberTasks = tasks.filter(t => t.assigned_to === memberId);
    const overdue = memberTasks.filter(t => {
      const s = getStatusInfo(t);
      return s.label === "Overdue" || s.label === "Past Due";
    }).length;
    const completed = memberTasks.filter(t => getStatusInfo(t).label === "Completed").length;
    return { total: memberTasks.length, overdue, completed };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if account type not yet set
  if (!currentUser?.account_type) {
    return <AccountSetup currentUser={currentUser} onDone={loadData} initialStep={setupStep} />;
  }

  return (
    <div className="space-y-4 max-w-sm md:max-w-2xl mx-auto px-3 sm:px-2 pt-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Manage Household</h1>
          <p className="text-sm text-muted-foreground">
            {currentUser.account_type === "family" && familyGroup
              ? "Manage Family Members"
              : "Solo Account"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 w-full h-11 text-base bg-blue-400 hover:bg-blue-500 text-white border-0">
          <Plus className="w-5 h-5" /> Add Member
        </Button>
      </div>

      {/* Avatars row */}
      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map(m => {
            const c = colorMap[m.avatar_color] || colorMap.blue;
            return (
              <div key={m.id} className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading", c.bg, c.text)}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{m.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Family invite code banner */}
      {currentUser.account_type === "family" && familyGroup && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex flex-col gap-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Family Code</p>
            <p className="font-heading font-bold text-lg tracking-widest">{familyGroup.invite_code}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCode} className="gap-1 flex-1 text-xs">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs">
                  <LogOut className="w-3 h-3" /> Leave
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Family?</AlertDialogTitle>
                  <AlertDialogDescription>You'll switch to a solo account. Your tasks will remain.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveFamily}>Leave Family</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Switch account type if solo */}
      {currentUser.account_type === "solo" && (
        <div className="bg-muted/50 border border-border rounded-lg p-2 flex flex-col gap-2">
          <div>
            <p className="font-medium text-xs">Running solo?</p>
            <p className="text-xs text-muted-foreground">Switch to family account to share.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleJoinFamily} className="w-full text-xs">
            Join Family
          </Button>
        </div>
      )}

      {/* App users in this family group */}
      {familyUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Household Members</p>
          <div className="grid gap-2">
            {familyUsers.map(u => (
              <div key={u.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold font-heading text-primary">
                  {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                {u.role === "admin" && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {members.map(m => {
          const c = colorMap[m.avatar_color] || colorMap.blue;
          const stats = getMemberStats(m.id);
          return (
            <div key={m.id} className="bg-card border border-border rounded-lg p-2 group relative">
              <button
                onClick={() => handleDelete(m.id)}
                className="absolute top-1 right-1 p-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-heading", c.bg, c.text)}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-heading font-semibold text-sm">{m.name}</h3>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-muted rounded-md py-1">
                  <p className="text-sm font-bold font-heading">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="bg-muted rounded-md py-1">
                  <p className="text-sm font-bold font-heading text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="bg-muted rounded-md py-1">
                  <p className="text-sm font-bold font-heading text-green-600">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border flex justify-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-sm text-destructive border-destructive/30 hover:bg-destructive/10 w-full h-11">Delete My Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete your account and all associated data. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">Delete Account</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Color</Label>
              <div className="flex gap-2 mt-2">
                {Object.keys(colorMap).map(c => (
                  <button
                    key={c}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      colorMap[c].dot,
                      color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-60 hover:opacity-100"
                    )}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}