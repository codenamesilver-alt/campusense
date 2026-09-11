import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fetchAll } from "@/lib/fetchAll";
import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TYPE_COLORS = {
  holiday: "#00ff88",
  exam: "#ff6b35",
  event: "#a855f7",
  meeting: "#f59e0b",
  sports: "#00f5ff",
  cultural: "#ff006e",
  other: "rgba(255,255,255,0.5)"
};

export default function SchoolEventsWidget() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
        const all = await fetchAll('SchoolEvent', 'start_date');
        const upcoming = all.filter(e => e.start_date >= today && e.start_date <= in14);
        setEvents(upcoming.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  return (
    <div className="rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(16px)" }}>
      <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <CalendarDays className="h-4 w-4" style={{ color: "#a855f7" }} />
          </div>
          <span className="text-xs font-mono tracking-widest" style={{ color: "#a855f7" }}>// UPCOMING EVENTS</span>
        </div>
        <Link to={createPageUrl("SchoolCalendar")} className="text-[10px] font-mono hover:opacity-70 transition-opacity" style={{ color: "rgba(168,85,247,0.6)" }}>VIEW ALL →</Link>
      </div>
      <div className="p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-5 w-5 rounded-full border-2" style={{ borderColor: "rgba(168,85,247,0.2)", borderTopColor: "#a855f7" }} />
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs font-mono text-center py-6" style={{ color: "rgba(255,255,255,0.3)" }}>No events in the next 14 days</p>
        ) : (
          events.map(ev => {
            const color = TYPE_COLORS[ev.event_type] || TYPE_COLORS.other;
            return (
              <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-bold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{ev.title}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{ev.start_date}{ev.end_date && ev.end_date !== ev.start_date ? ` → ${ev.end_date}` : ""}</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>{ev.event_type}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}