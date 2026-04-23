import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, CheckCircle } from "lucide-react";

export default function SyncCalendarButton() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [summary, setSummary] = useState("");

  async function handleSync() {
    setStatus("loading");
    const res = await base44.functions.invoke("syncToCalendar", {});
    const data = res.data;
    if (data?.success) {
      setSummary(`${data.created} created, ${data.updated} updated`);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setSummary(data?.error || "Sync failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <Button
      variant="default"
      onClick={handleSync}
      disabled={status === "loading"}
      className="gap-2 flex-1 text-lg h-14 bg-blue-400 hover:bg-blue-500 border-blue-400"
    >
      {status === "loading" ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : status === "done" ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : null}
      {status === "loading"
        ? "Syncing..."
        : status === "done"
        ? summary
        : status === "error"
        ? summary
        : "Sync to Calendar"}
    </Button>
  );
}