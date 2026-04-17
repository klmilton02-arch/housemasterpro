import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw, Link, Unlink } from "lucide-react";

const CONNECTOR_ID = "69e2b957289ba8a84c5a217a";

export default function SyncGoogleTasksButton() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rule 2: reusable fetch — doubles as connection check
  const trySyncCheck = async () => {
    try {
      const res = await base44.functions.invoke('syncToGoogleTasks', {});
      setConnected(true);
      return res.data;
    } catch {
      setConnected(false);
      return null;
    }
  };

  // Rule 1+2: check auth, then detect connection
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        // Just check connection without syncing on load
        try {
          const { accessToken } = await base44.asServiceRole?.connectors?.getCurrentAppUserConnection?.(CONNECTOR_ID) || {};
          if (accessToken) setConnected(true);
        } catch {
          setConnected(false);
        }
      }
      setLoading(false);
    });
  }, []);

  // Rule 3: open OAuth popup, poll for close
  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnected(true);
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setSyncResult(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const result = await trySyncCheck();
    setSyncResult(result);
    setSyncing(false);
  };

  if (loading) return null;

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => base44.auth.redirectToLogin()}>
        Sign in to sync Google Tasks
      </Button>
    );
  }

  if (!connected) {
    return (
      <Button variant="outline" size="sm" onClick={handleConnect} className="gap-2">
        <Link className="w-4 h-4" />
        Connect Google Tasks
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {syncResult && (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {syncResult.synced} task{syncResult.synced !== 1 ? 's' : ''} synced
        </span>
      )}
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync to Google Tasks'}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDisconnect} className="gap-1 text-muted-foreground">
        <Unlink className="w-3.5 h-3.5" />
        Disconnect
      </Button>
    </div>
  );
}