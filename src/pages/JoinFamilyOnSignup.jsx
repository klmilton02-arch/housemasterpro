import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function JoinFamilyOnSignup() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.family_group_id) {
        navigate("/dashboard", { replace: true });
      }
      setLoading(false);
    });
  }, [navigate]);

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setJoining(true);
    setError("");
    try {
      await base44.functions.invoke("joinFamilyWithCode", {
        invite_code: inviteCode.trim().toUpperCase(),
      });
      // Wait a moment for backend to sync, then hard redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
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
          <p className="text-sm text-muted-foreground">
            Join an existing family or skip to get started
          </p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Family invite code"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={handleJoin}
            disabled={joining || !inviteCode.trim()}
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