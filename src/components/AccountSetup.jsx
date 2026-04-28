import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, User, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AccountSetup({ currentUser, onDone, initialStep = "choose" }) {
  const [step, setStep] = useState(initialStep); // choose | create-family | join-family | created
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSolo() {
    setLoading(true);
    await base44.auth.updateMe({ account_type: "solo", family_group_id: "" });
    setLoading(false);
    onDone();
  }

  async function handleCreateFamily() {
    if (!familyName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const me = await base44.auth.me();
      const code = generateCode();
      const group = await base44.entities.FamilyGroup.create({
        name: familyName.trim(),
        invite_code: code,
        owner_email: me.email,
      });
      await base44.auth.updateMe({ account_type: "family", family_group_id: group.id });
      setCreatedCode(code);
      setStep("created");
    } catch (err) {
      setError("Failed to create family. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinFamily() {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError("");
    const groups = await base44.entities.FamilyGroup.filter({ invite_code: joinCode.trim().toUpperCase() }).catch(() => []);
    if (groups.length === 0) {
      setError("Invalid invite code. Please check and try again.");
      setLoading(false);
      return;
    }
    await base44.auth.updateMe({ account_type: "family", family_group_id: groups[0].id });
    setLoading(false);
    onDone();
  }

  function copyCode() {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "choose") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Welcome to FamilySync</h1>
          <p className="text-muted-foreground">How would you like to use this app?</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-md w-full">
          <button
            onClick={handleSolo}
            disabled={loading}
            className="bg-card border-2 border-border hover:border-primary/50 rounded-2xl p-6 text-left transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <User className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">Solo</h3>
            <p className="text-sm text-muted-foreground">Manage tasks just for yourself.</p>
          </button>
          <button
            onClick={() => setStep("family-choice")}
            className="bg-card border-2 border-border hover:border-primary/50 rounded-2xl p-6 text-left transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Users className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">Family</h3>
            <p className="text-sm text-muted-foreground">Share tasks with your household.</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === "family-choice") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full">
          <button onClick={() => setStep("choose")} className="text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">← Back</button>
          <h2 className="font-heading text-2xl font-bold mb-6">Join or Create a Family</h2>
          <div className="space-y-3">
            <button
              onClick={() => setStep("create-family")}
              className="w-full bg-card border-2 border-border hover:border-primary/50 rounded-xl p-4 text-left flex items-center justify-between transition-all hover:shadow-sm group"
            >
              <div>
                <p className="font-semibold">Create a new family</p>
                <p className="text-sm text-muted-foreground">Start fresh and invite others</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </button>
            <button
              onClick={() => setStep("join-family")}
              className="w-full bg-card border-2 border-border hover:border-primary/50 rounded-xl p-4 text-left flex items-center justify-between transition-all hover:shadow-sm group"
            >
              <div>
                <p className="font-semibold">Join an existing family</p>
                <p className="text-sm text-muted-foreground">Enter an invite code</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "create-family") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full">
          <button onClick={() => setStep("family-choice")} className="text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">← Back</button>
          <h2 className="font-heading text-2xl font-bold mb-2">Name your family</h2>
          <p className="text-sm text-muted-foreground mb-6">You'll get an invite code to share with household members.</p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Family Name</Label>
              <Input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="e.g., The Smiths" className="mt-1" onKeyDown={e => e.key === "Enter" && handleCreateFamily()} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleCreateFamily} disabled={loading || !familyName.trim()}>
              {loading ? "Creating..." : "Create Family"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "join-family") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full">
          <button onClick={() => setStep("family-choice")} className="text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">← Back</button>
          <h2 className="font-heading text-2xl font-bold mb-2">Enter invite code</h2>
          <p className="text-sm text-muted-foreground mb-6">Ask your family admin for the 6-character invite code.</p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Invite Code</Label>
              <Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g., AB12CD" className="mt-1 font-mono tracking-widest text-center text-lg uppercase" maxLength={6} />
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <Button className="w-full" onClick={handleJoinFamily} disabled={loading || joinCode.length < 6}>
              {loading ? "Joining..." : "Join Family"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "created") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Family created!</h2>
          <p className="text-sm text-muted-foreground mb-6">Share this invite code with your household members.</p>
          <div className="bg-muted rounded-xl p-6 mb-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Invite Code</p>
            <p className="font-heading text-4xl font-bold tracking-[0.3em] text-foreground mb-4">{createdCode}</p>
            <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </div>
          <Button className="w-full" onClick={onDone}>Continue</Button>
        </div>
      </div>
    );
  }

  return null;
}