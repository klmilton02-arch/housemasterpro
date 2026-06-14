import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { notifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!notifications.isSupported()) return;
    const dismissed = localStorage.getItem('hlf_notif_dismissed');
    if (!dismissed && notifications.getPermission() === 'default') {
      // Slight delay so it doesn't fire immediately on load
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  async function handleEnable() {
    const granted = await notifications.requestPermission();
    if (granted) {
      await notifications.show('Notifications enabled!', 'You\'ll be reminded when tasks are due.');
    }
    setShow(false);
  }

  function handleDismiss() {
    localStorage.setItem('hlf_notif_dismissed', '1');
    setShow(false);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Enable task reminders?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Get notified when tasks are due.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleEnable}>Enable</Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>Not now</Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 rounded hover:bg-muted shrink-0">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}