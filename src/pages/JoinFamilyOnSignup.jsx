import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

export default function JoinFamilyOnSignup() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("code");
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
    }

    base44.auth.me().then(user => {
      if (user?.family_group_id) {
        navigate("/dashboard", { replace: true });
      }
      setLoading(false);
    });
  }, [navigate]);

  async function handleJoin() {
    if (!inviteCode.trim() || !displayName.trim()) return;
    setJoining(true);
    setError("");
    try {
      await base44.functions.invoke("joinFamilyWithCode", {
        invite_code: inviteCode.trim().toUpperCase(),
        display_name: displayName.trim(),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to join family");
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-bold">Welcome!</h1>
          <p className="text-sm text-muted-foreground">Enter your invite code and choose your name to join your family.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Family Invite Code</Label>
            <Input
              placeholder="e.g., AB12CD"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
              className="font-mono tracking-widest text-center text-lg uppercase"
              autoFocus={!inviteCode}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Your Name</Label>
            <Input
              placeholder="What should your family call you?"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
              autoFocus={!!inviteCode}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            onClick={handleJoin}
            disabled={joining || !inviteCode.trim() || !displayName.trim()}
            className="w-full"
          >
            {joining ? "Joining..." : "Join Family"}
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="w-full"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}