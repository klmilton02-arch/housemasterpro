import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export default function CompleteAsSheet({ open, onOpenChange, familyMembers, onSelect }) {
  const uniqueMembers = Array.from(new Map(familyMembers.map(m => [m.name.toLowerCase().trim(), m])).values());
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-heading">Who completed this?</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-2">
          {uniqueMembers.map(m => (
            <button
              key={m.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 active:scale-95 transition-all"
              onClick={() => { onSelect(m); onOpenChange(false); }}
            >
              <div className={`w-9 h-9 rounded-full bg-${m.avatar_color}-500 flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {m.name[0]}
              </div>
              <span className="font-medium text-foreground">{m.name}</span>
            </button>
          ))}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 active:scale-95 transition-all"
            onClick={() => { onSelect(null); onOpenChange(false); }}
          >
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
              ?
            </div>
            <span className="font-medium text-muted-foreground">Just me / No one specific</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}