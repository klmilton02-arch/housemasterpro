import { Check, Trash2, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useState } from "react";
import MobileSelect from "./MobileSelect";

export default function BatchToolbar({ selectedCount, onComplete, onDelete, onReassign, onCancel, familyMembers }) {
  const [reassignDrawerOpen, setReassignDrawerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-card border border-border shadow-xl rounded-2xl px-4 py-3 flex items-center gap-2 w-full max-w-xs">
          <span className="text-sm font-medium text-foreground flex-1">{selectedCount} selected</span>
          <Button size="sm" variant="ghost" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 px-2" onClick={onComplete}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2" onClick={() => setReassignDrawerOpen(true)}>
            <UserCheck className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="px-2 text-muted-foreground" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Reassign Drawer */}
      <Drawer open={reassignDrawerOpen} onOpenChange={setReassignDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-heading">Reassign {selectedCount} task{selectedCount > 1 ? "s" : ""}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            {familyMembers.map(m => (
              <button
                key={m.id}
                className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                onClick={() => { onReassign(m); setReassignDrawerOpen(false); }}
              >
                {m.name}
              </button>
            ))}
            <button
              className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
              onClick={() => { onReassign(null); setReassignDrawerOpen(false); }}
            >
              Unassign
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirm Delete Drawer */}
      <Drawer open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-heading">Delete {selectedCount} task{selectedCount > 1 ? "s" : ""}?</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3">
            <p className="text-sm text-muted-foreground">This cannot be undone.</p>
            <Button variant="destructive" className="w-full" onClick={() => { onDelete(); setConfirmDelete(false); }}>
              Delete
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}