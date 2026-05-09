import { useState, useEffect, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from '@/lib/query-client';
import { Users, Link2, Link2Off, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creatingFamily, setCreatingFamily] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [familyGroup, setFamilyGroup] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [createFamilyError, setCreateFamilyError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      if (me?.family_group_id) {
        try {
          const [membersRes, fgRes, usersRes] = await Promise.all([
            base44.functions.invoke('getFamilyMembers', {}),
            base44.entities.FamilyGroup.get(me.family_group_id),
            base44.functions.invoke('getFamilyAppUsers', {}),
          ]);
          setFamilyUsers(usersRes.data.users || [me]);
          setFamilyMembers(membersRes.data.members || []);
          setFamilyGroup(fgRes);

        } catch (err) {
          // Family group doesn't exist - clear the user's family_group_id
          console.error("Failed to load family data:", err);
          await base44.auth.updateMe({ family_group_id: null });
          setFamilyGroup(null);
        }
      }
    } catch (err) {
      console.error("Failed to load family data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData();
  }, [loadData]);

async function handleCreateFamily() {
    if (!newFamilyName.trim()) return;
    setCreatingFamily(true);
    setCreateFamilyError("");
    try {
      const res = await base44.functions.invoke('createNewFamilyGroup', { family_name: newFamilyName });
      setNewFamilyName("");
      setShowCreateFamily(false);
      await loadData();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.data?.error || err.message || "Failed to create family";
      setCreateFamilyError(errorMsg);
      console.error("Failed to create family:", err);
    } finally {
      setCreatingFamily(false);
    }
  }

  async function handleJoinFamily() {
    if (!inviteCode.trim()) return;
    setJoiningFamily(true);
    setJoinError("");
    try {
      const result = await base44.functions.invoke('joinFamilyWithCode', { invite_code: inviteCode.trim().toUpperCase() });
      console.log("Join result:", result);
      setInviteCode("");
      // Refresh user data and refetch to ensure family_group_id is updated
      const me = await base44.auth.me();
      console.log("Updated user:", me);
      setUser(me);
      if (me?.family_group_id) {
        const [membersRes, fgRes, usersRes] = await Promise.all([
          base44.functions.invoke('getFamilyMembers', {}),
          base44.entities.FamilyGroup.get(me.family_group_id),
          base44.functions.invoke('getFamilyAppUsers', {}),
        ]);
        setFamilyUsers(usersRes.data.users || [me]);
        setFamilyMembers(membersRes.data.members || []);
        setFamilyGroup(fgRes);
      }
    } catch (err) {
      console.error("Join failed:", err);
      const message = err?.response?.data?.error || err?.data?.error || err.message || "Failed to join family";
      setJoinError(message);
    } finally {
      setJoiningFamily(false);
    }
  }

  async function handleAddMember() {
    if (!newMemberName.trim() || !user?.family_group_id) return;
    setSaving(true);
    try {
      await base44.functions.invoke('addFamilyMember', {
        name: newMemberName.trim(),
        avatar_color: newMemberColor,
      });
      setNewMemberName("");
      setNewMemberColor("blue");
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      console.error("Failed to add member:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleLink(member, appUser) {
    setSaving(true);
    await base44.functions.invoke('linkMemberToUser', {
      member_id: member.id,
      user_id: appUser.id,
      user_email: appUser.email,
    });
    setLinkingMemberId(null);
    setSaving(false);
    loadData();
  }

  async function handleUnlink(member) {
    setSaving(true);
    await base44.functions.invoke('unlinkFamilyMember', { member_id: member.id });
    setSaving(false);
    loadData();
  }

  async function handleDeleteMember(memberId) {
    setSaving(true);
    await base44.functions.invoke('deleteFamilyMember', { member_id: memberId });
    setSaving(false);
    loadData();
  }

  async function handleInviteUser() {
    if (!inviteEmail.trim() || !familyGroup) return;
    setInvitingUser(true);
    setInviteError("");
    try {
      await base44.functions.invoke('inviteUserWithFamilyCode', {
        email: inviteEmail.trim(),
        role: "user",
        invite_code: familyGroup.invite_code,
      });
      setInviteEmail("");
      setShowInviteUser(false);
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.data?.error || err.message || "Failed to send invite";
      setInviteError(errorMsg);
      console.error("Failed to invite user:", err);
    } finally {
      setInvitingUser(false);
    }
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

      {/* Join or Create Family Group */}
      {(!user?.family_group_id || !familyGroup) && (
        <div className="space-y-3">
          <Dialog open={showCreateFamily} onOpenChange={setShowCreateFamily}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" /> Create New Family
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Create Family Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Family name"
                  value={newFamilyName}
                  onChange={e => { setNewFamilyName(e.target.value); setCreateFamilyError(""); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateFamily(); if (e.key === 'Escape') setShowCreateFamily(false); }}
                  autoFocus
                />
                {createFamilyError && <p className="text-xs text-destructive">{createFamilyError}</p>}
                <div className="flex gap-2">
                  <Button onClick={handleCreateFamily} disabled={creatingFamily || !newFamilyName.trim()}>
                    {creatingFamily ? "Creating..." : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCreateFamily(false); setCreateFamilyError(""); }}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Already have a family code?</p>
            <Input
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={e => { setInviteCode(e.target.value); setJoinError(""); }}
              onKeyDown={e => { if (e.key === 'Enter') handleJoinFamily(); }}
              autoFocus={false}
            />
            {joinError && <p className="text-xs text-destructive">{joinError}</p>}
            <Button onClick={handleJoinFamily} disabled={joiningFamily || !inviteCode.trim()} className="w-full">
              {joiningFamily ? "Joining..." : "Join Family"}
            </Button>
          </div>
        </div>
      )}

      {/* Leave Family Button */}
      {user?.family_group_id && familyGroup && (
        <Button 
          variant="outline" 
          onClick={async () => {
            if (window.confirm("Are you sure you want to leave this family?")) {
              await base44.auth.updateMe({ family_group_id: null });
              setUser(null);
              setFamilyGroup(null);
              loadData();
            }
          }}
          className="w-full text-destructive hover:bg-destructive/10"
        >
          Leave Family
        </Button>
      )}

      {/* Share Family Invite Code */}
      {user?.family_group_id && familyGroup && (
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Family Invite Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-blue-100 dark:bg-blue-900/40 px-3 py-2 rounded font-mono font-semibold text-blue-700 dark:text-blue-300 text-center text-xs break-all">
                {`homelifefocus.com/join-family?code=${familyGroup?.invite_code}`}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`homelifefocus.com/join-family?code=${familyGroup?.invite_code}`);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="shrink-0"
              >
                {copiedCode ? "✓ Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Share this link with family members to auto-fill their invite code</p>
          </div>

          <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2 bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4" /> Invite Family Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Invite Family Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Send an invite email with your family code. They'll sign up and choose their name.</p>
                <Input
                  placeholder="Email address"
                  type="email"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteError(""); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleInviteUser(); if (e.key === 'Escape') setShowInviteUser(false); }}
                  autoFocus
                />
                {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
                <div className="flex gap-2">
                  <Button onClick={handleInviteUser} disabled={invitingUser || !inviteEmail.trim()} className="flex-1">
                    {invitingUser ? "Sending..." : "Send Invite"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowInviteUser(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
                  {(linkedUser || member.linked_user_email) ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-green-800 dark:text-green-300">{linkedUser?.full_name || member.linked_user_email}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{linkedUser?.email || member.linked_user_email}</p>
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
                  ) : isLinking ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Select user to link:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {familyUsers.filter(u => !u.linked_to_member).map(appUser => (
                          <button
                            key={appUser.id}
                            onClick={() => handleLink(member, appUser)}
                            disabled={saving}
                            className="w-full text-left px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-md transition-colors"
                          >
                            <p className="font-medium text-blue-900 dark:text-blue-200">{appUser.full_name}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{appUser.email}</p>
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLinkingMemberId(null)}
                        className="w-full text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLinkingMemberId(member.id)}
                        className="text-xs gap-1 flex-1 justify-center"
                      >
                        <Link2 className="w-3 h-3" /> Link to User Account
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id)}
                        disabled={saving}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
              const isMe = u.id === user?.id;
              return (
                <div key={u.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    {!isMe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        onClick={async () => {
                          if (!window.confirm(`Remove ${u.full_name} from this family?`)) return;
                          setSaving(true);
                          await base44.functions.invoke('removeUserFromFamily', { user_id: u.id });
                          setSaving(false);
                          loadData();
                        }}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
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