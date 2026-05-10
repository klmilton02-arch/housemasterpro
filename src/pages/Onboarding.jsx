import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Home, User as UserIcon, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [step, setStep] = useState("choice"); // "choice", "join", "create", "solo"
  const [familyCode, setFamilyCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSkip = async () => {
    // Mark as solo user, skip to dashboard
    const me = await base44.auth.me();
    await base44.auth.updateMe({ onboarding_completed: true });
    navigate("/dashboard");
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) {
      setError("Please enter an invite code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await base44.functions.invoke("joinFamilyWithCode", { invite_code: familyCode.trim() });
      await base44.auth.updateMe({ onboarding_completed: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to join family. Check the code and try again.");
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError("Please enter a family name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await base44.functions.invoke("createNewFamilyGroup", { family_name: familyName.trim() });
      await base44.auth.updateMe({ onboarding_completed: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create family. Please try again.");
      setLoading(false);
    }
  };

  const handleSoloStart = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to save preference. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-heading text-4xl font-bold text-foreground">Welcome</h1>
          <p className="text-muted-foreground">How would you like to get started?</p>
        </div>

        {/* Choice Screen */}
        {step === "choice" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("join")}
              className="w-full bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Join a Family</p>
                    <p className="text-xs text-muted-foreground">Share tasks with others</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              </div>
            </button>

            <button
              onClick={() => setStep("create")}
              className="w-full bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Home className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Start a Family</p>
                    <p className="text-xs text-muted-foreground">Invite family members later</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              </div>
            </button>

            <button
              onClick={() => setStep("solo")}
              className="w-full bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Go Solo</p>
                    <p className="text-xs text-muted-foreground">Manage tasks on your own</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              </div>
            </button>
          </div>
        )}

        {/* Join Family Screen */}
        {step === "join" && (
          <div className="space-y-4 bg-card border border-border rounded-lg p-6">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              ← Back
            </button>
            <div>
              <Label className="text-sm font-medium">Family Invite Code</Label>
              <Input
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value)}
                placeholder="e.g. ABC123XYZ"
                className="mt-2 uppercase"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-2">Ask a family member for their invite code</p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleJoinFamily} disabled={loading || !familyCode.trim()} className="w-full">
              {loading ? "Joining..." : "Join Family"}
            </Button>
          </div>
        )}

        {/* Create Family Screen */}
        {step === "create" && (
          <div className="space-y-4 bg-card border border-border rounded-lg p-6">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              ← Back
            </button>
            <div>
              <Label className="text-sm font-medium">Family Name</Label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Smiths, Team Home"
                className="mt-2"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-2">You can invite others after setup</p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleCreateFamily} disabled={loading || !familyName.trim()} className="w-full">
              {loading ? "Creating..." : "Create Family"}
            </Button>
          </div>
        )}

        {/* Solo Screen */}
        {step === "solo" && (
          <div className="space-y-4 bg-card border border-border rounded-lg p-6">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              ← Back
            </button>
            <div className="space-y-3 text-sm">
              <p className="text-foreground font-medium">You're all set!</p>
              <p className="text-muted-foreground">You can start managing your tasks right away. You can join or start a family anytime from your profile settings.</p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleSoloStart} disabled={loading} className="w-full">
              {loading ? "Getting started..." : "Get Started"}
            </Button>
          </div>
        )}

        {/* Footer */}
        {step === "choice" && (
          <p className="text-center text-xs text-muted-foreground">
            You can change this later in your profile settings
          </p>
        )}
      </div>
    </div>
  );
}