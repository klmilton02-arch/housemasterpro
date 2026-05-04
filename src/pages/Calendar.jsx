import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getEventColor(colorId) {
  const colors = {
    "1": "bg-blue-400", "2": "bg-green-400", "3": "bg-purple-400",
    "4": "bg-red-400", "5": "bg-yellow-400", "6": "bg-orange-400",
    "7": "bg-teal-400", "8": "bg-gray-400", "9": "bg-blue-600",
    "10": "bg-green-600", "11": "bg-red-600",
  };
  return colors[colorId] || "bg-primary";
}

function EventDot({ event }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${getEventColor(event.colorId)} shrink-0`} />
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date());

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('getGoogleCalendarEvents', {});
      setEvents(res.data.events || []);
    } catch (err) {
      setError("Could not load Google Calendar events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun
  const paddedDays = [...Array(startPad).fill(null), ...days];

  function getEventsForDay(day) {
    return events.filter(evt => {
      const dateStr = evt.start?.dateTime || evt.start?.date;
      if (!dateStr) return false;
      try {
        return isSameDay(parseISO(dateStr), day);
      } catch { return false; }
    });
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  function formatEventTime(evt) {
    if (evt.start?.date && !evt.start?.dateTime) return "All day";
    if (!evt.start?.dateTime) return "";
    try {
      return format(parseISO(evt.start.dateTime), "h:mm a");
    } catch { return ""; }
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-7 pb-10 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Calendar</h1>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open Google Calendar
        </a>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="font-heading font-semibold text-base">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} className="min-h-[52px] border-r border-b border-border last:border-r-0" />;
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const todayFlag = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[52px] p-1 border-r border-b border-border last:border-r-0 flex flex-col items-center gap-0.5 transition-colors hover:bg-muted/50 text-left",
                  isSelected && "bg-primary/10",
                  i % 7 === 6 && "border-r-0"
                )}
              >
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                  todayFlag && "bg-primary text-primary-foreground",
                  isSelected && !todayFlag && "bg-primary/20 text-primary"
                )}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {dayEvents.slice(0, 3).map((evt, ei) => (
                    <EventDot key={ei} event={evt} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-sm text-muted-foreground">
          {selectedDay ? format(selectedDay, "EEEE, MMMM d") : "Select a day"}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        ) : selectedDayEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">No events on this day</div>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map(evt => (
              <div key={evt.id} className="bg-card border border-border rounded-lg px-4 py-3 space-y-1">
                <div className="flex items-start gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${getEventColor(evt.colorId)}`} />
                  <p className="font-medium text-sm">{evt.summary || "(No title)"}</p>
                </div>
                {formatEventTime(evt) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-4">
                    <Clock className="w-3 h-3" />
                    {formatEventTime(evt)}
                    {evt.end?.dateTime && (
                      <> – {format(parseISO(evt.end.dateTime), "h:mm a")}</>
                    )}
                  </div>
                )}
                {evt.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-4">
                    <MapPin className="w-3 h-3" />
                    {evt.location}
                  </div>
                )}
                {evt.description && (
                  <p className="text-xs text-muted-foreground pl-4 line-clamp-2">{evt.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}