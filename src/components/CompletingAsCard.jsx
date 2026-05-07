import { useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export default function CompletingAsCard({ familyMembers, activeCompletingAs, onSelect, selfMember }) {
  const [open, setOpen] = useState(false);

  const colorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
    teal: "bg-teal-500",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          {activeCompletingAs ? (
            <div className={`w-8 h-8 rounded-full ${colorMap[activeCompletingAs.avatar_color] || "bg-blue-500"} flex items-center justify-center text-white text-sm font-bold`}>
              {activeCompletingAs.name[0]}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="text-left">
            <p className="text-xs text-muted-foreground font-medium">Completing as</p>
            <p className="text-sm font-semibold text-foreground">
              {activeCompletingAs ? activeCompletingAs.name : "Me"}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Who is completing tasks?</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-2">
            {/* Only show generic "Me" if user isn't linked to any member */}
            {!selfMember && (
              <button
                onClick={() => { onSelect(null); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  !activeCompletingAs
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Me</p>
                  <p className="text-xs text-muted-foreground">Complete as yourself</p>
                </div>
                {!activeCompletingAs && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
              </button>
            )}

            {/* Family members */}
            {familyMembers.map(m => (
              <button
                key={m.id}
                onClick={() => { onSelect(m); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  activeCompletingAs?.id === m.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${colorMap[m.avatar_color] || "bg-blue-500"} flex items-center justify-center text-white text-sm font-bold`}>
                  {m.name[0]}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{m.name}{selfMember?.id === m.id ? " (Me)" : ""}</p>
                </div>
                {activeCompletingAs?.id === m.id && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}