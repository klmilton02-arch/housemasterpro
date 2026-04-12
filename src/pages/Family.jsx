import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStatusInfo } from "../components/TaskCard";

const colorMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  teal: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
};

export default function Family() {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const { deleteAccount } = useAuth();

  const loadData = useCallback(async () => {
    const [m, t] = await Promise.all([
      base44.entities.FamilyMember.list(),
      base44.entities.Task.list("-created_date", 500),
    ]);
    setMembers(m);
    setTasks(t);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Family Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your household members</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(m => {
          const c = colorMap[m.avatar_color] || colorMap.blue;
          const stats = getMemberStats(m.id);
          return (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5 group relative">
              <button
                onClick={() => handleDelete(m.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-heading", c.bg, c.text)}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-heading font-semibold text-lg">{m.name}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg py-2">
                  <p className="text-lg font-bold font-heading">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="bg-muted rounded-lg py-2">
                  <p className="text-lg font-bold font-heading text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="bg-muted rounded-lg py-2">
                  <p className="text-lg font-bold font-heading text-green-600">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border flex justify-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10">Delete My Account</Button>
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