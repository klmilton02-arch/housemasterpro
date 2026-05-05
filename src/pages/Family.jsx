import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { base44 } from "@/api/base44Client";
import { Users, Link2, Link2Off, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

export default function Family() {
  const PAGES = ["/dashboard", "/tasks", "/burst", "/leaderboard", "/presets", "/home-setup", "/profile"];
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(PAGES);

  const [user, setUser] = useState(null);
  const [familyUsers, setFamilyUsers] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkingMemberId, setLinkingMemberId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberColor, setNewMemberColor] = useState("blue");

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      if (me?.family_group_id) {
        const [allUsers, members] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.FamilyMember.filter({ family_group_id: me.family_group_id }),
        ]);
        setFamilyUsers(allUsers.filter(u => u.family_group_id === me.family_group_id));
        setFamilyMembers(members);
      }
    } catch (err) {
      console.error("Failed to load family data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddMember() {
    if (!newMemberName.trim() || !user?.family_group_id) return;
    setSaving(true);
    await base44.entities.FamilyMember.create({
      family_group_id: user.family_group_id,
      name: newMemberName.trim(),
      avatar_color: newMemberColor,
    });
    setNewMemberName("");
    setNewMemberColor("blue");
    setShowAddForm(false);
    setSaving(false);
    loadData();
  }

  async function handleLink(member, appUser) {
    setSaving(true);
    const fgid = member.family_group_id || user?.family_group_id;
    await base44.entities.FamilyMember.update(member.id, {
      family_group_id: fgid,
      linked_user_id: appUser.id,
      linked_user_email: appUser.email,
    });
    setLinkingMemberId(null);
    setSaving(false);
    loadData();
  }

  async function handleUnlink(member) {
    setSaving(true);
    await base44.entities.FamilyMember.update(member.id, {
      linked_user_id: null,
      linked_user_email: null,
    });
    setSaving(false);
    loadData();
  }

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

      {/* Add Family Member */}
      {user?.family_group_id && (
        <div>
          {showAddForm ? (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">New Family Member</p>
              <Input
                placeholder="Name"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddMember(); if (e.key === 'Escape') setShowAddForm(false); }}
                autoFocus
              />
              <div className="flex gap-2">
                {Object.keys(colorMap).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewMemberColor(color)}
                    className={`w-7 h-7 rounded-full ${colorMap[color]} ${newMemberColor === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddMember} disabled={saving || !newMemberName.trim()}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setNewMemberName(""); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4" /> Add Family Member
            </Button>
          )}
        </div>
      )}

      {/* Family Members with linked accounts */}
      {familyMembers.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-base text-muted-foreground uppercase tracking-wide text-xs">Family Members</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {familyMembers.map(member => {
              const linkedUser = familyUsers.find(u => u.id === member.linked_user_id);
              const isLinking = linkingMemberId === member.id;

              return (
                <div key={member.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${colorMap[member.avatar_color] || "bg-slate-400"} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                    </div>
                  </div>

                  {/* Linked account */}
                  {linkedUser ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-green-800 dark:text-green-300">{linkedUser.full_name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{linkedUser.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlink(member)}
                        disabled={saving}
                        className="text-green-700 hover:text-red-600 gap-1 text-xs"
                      >
                        <Link2Off className="w-3 h-3" /> Unlink
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {isLinking ? (
                        <div className="space-y-1 border border-border rounded-md overflow-hidden">
                          <p className="text-xs text-muted-foreground px-3 pt-2 pb-1">Select a user account to link:</p>
                          {familyUsers.filter(u => !familyMembers.some(m => m.id !== member.id && m.linked_user_id === u.id)).map(u => (
                            <button
                              key={u.id}
                              onClick={() => handleLink(member, u)}
                              disabled={saving}
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 border-t border-border first:border-t-0"
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                                {u.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{u.full_name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={() => setLinkingMemberId(null)}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-xs text-muted-foreground border-t border-border"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLinkingMemberId(member.id)}
                          className="text-xs gap-1 w-full justify-center"
                        >
                          <Link2 className="w-3 h-3" /> Link to User Account
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">No family members yet</p>
        </div>
      )}

      {/* App users in this family group */}
      {familyUsers.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wide">App Users</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {familyUsers.map(u => {
              const linked = familyMembers.find(m => m.linked_user_id === u.id);
              return (
                <div key={u.id} className="px-4 py-3 space-y-1">
                  <p className="font-medium text-sm">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{u.role}</span>
                    {linked ? (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded">
                        Linked to: {linked.name}
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">No member linked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}