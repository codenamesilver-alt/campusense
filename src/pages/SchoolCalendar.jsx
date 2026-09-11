import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fetchAll } from "@/lib/fetchAll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Edit, Trash2, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { usePermissions } from "@/components/auth/PermissionProvider";

const EVENT_TYPES = [
  { value: "holiday", label: "Holiday", color: "#00ff88", bg: "rgba(0,255,136,0.15)", border: "rgba(0,255,136,0.4)" },
  { value: "exam", label: "Exam", color: "#ff6b35", bg: "rgba(255,107,53,0.15)", border: "rgba(255,107,53,0.4)" },
  { value: "event", label: "School Event", color: "#a855f7", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.4)" },
  { value: "meeting", label: "Meeting", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)" },
  { value: "sports", label: "Sports", color: "#00f5ff", bg: "rgba(0,245,255,0.15)", border: "rgba(0,245,255,0.4)" },
  { value: "cultural", label: "Cultural", color: "#ff006e", bg: "rgba(255,0,110,0.15)", border: "rgba(255,0,110,0.4)" },
  { value: "other", label: "Other", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.2)" }
];

const getTypeStyle = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const emptyEvent = { title: "", description: "", event_type: "event", start_date: "", end_date: "", is_all_day: true, applicable_to: "all", specific_class: "" };

export default function SchoolCalendar() {
  const { isAdmin } = usePermissions();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyEvent);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchAll('SchoolEvent', '-start_date');
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => {
      const start = e.start_date;
      const end = e.end_date || e.start_date;
      return dateStr >= start && dateStr <= end;
    });
  };

  const openAdd = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setForm({ ...emptyEvent, start_date: dateStr, end_date: dateStr });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (event, e) => {
    e.stopPropagation();
    setForm({ ...event });
    setEditId(event.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this event?")) return;
    await base44.entities.SchoolEvent.delete(id);
    fetchEvents();
  };

  const handleSave = async () => {
    if (!form.title || !form.start_date) return;
    if (editId) {
      await base44.entities.SchoolEvent.update(editId, form);
    } else {
      await base44.entities.SchoolEvent.create(form);
    }
    setDialogOpen(false);
    fetchEvents();
  };

  // Upcoming events (next 30 days)
  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const upcoming = events.filter(e => e.start_date >= today && e.start_date <= in30).sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a0e1a 100%)" }}>
      {/* Header */}
      <motion.div className="rounded-2xl mb-6 p-6" style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.08), rgba(168,85,247,0.1))", border: "1px solid rgba(0,245,255,0.2)", backdropFilter: "blur(20px)" }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl" style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)" }}>
              <CalendarDays className="h-7 w-7" style={{ color: "#00f5ff" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black font-mono" style={{ color: "#00f5ff", textShadow: "0 0 16px rgba(0,245,255,0.5)" }}>SCHOOL CALENDAR</h1>
              <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>Holidays · Exams · Events · Meetings</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => { setForm(emptyEvent); setEditId(null); setDialogOpen(true); }} className="font-mono" style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
              <Plus className="h-4 w-4 mr-2" /> ADD EVENT
            </Button>
          )}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {EVENT_TYPES.map(t => (
          <span key={t.value} className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>{t.label}</span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <motion.div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,245,255,0.15)", backdropFilter: "blur(16px)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "#00f5ff" }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-black font-mono" style={{ color: "#00f5ff" }}>{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "#00f5ff" }}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-mono py-2" style={{ color: "rgba(255,255,255,0.35)" }}>{d}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const todayStr = new Date().toISOString().split("T")[0];
              const thisDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = thisDay === todayStr;
              return (
                <div
                  key={day}
                  onClick={() => isAdmin && openAdd(day)}
                  className="rounded-lg p-1.5 min-h-[64px] transition-all"
                  style={{
                    background: isToday ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
                    border: isToday ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(255,255,255,0.05)",
                    cursor: isAdmin ? "pointer" : "default"
                  }}
                >
                  <p className="text-xs font-mono mb-1 font-bold" style={{ color: isToday ? "#00f5ff" : "rgba(255,255,255,0.6)" }}>{day}</p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => {
                      const style = getTypeStyle(ev.event_type);
                      return (
                        <div key={ev.id} className="flex items-center gap-1 group">
                          <span className="text-[10px] font-mono truncate flex-1 px-1 rounded" style={{ background: style.bg, color: style.color }}>{ev.title}</span>
                          {isAdmin && (
                            <div className="hidden group-hover:flex gap-0.5">
                              <button onClick={(e) => openEdit(ev, e)} className="hover:opacity-70"><Edit className="h-2.5 w-2.5" style={{ color: "#00f5ff" }} /></button>
                              <button onClick={(e) => handleDelete(ev.id, e)} className="hover:opacity-70"><Trash2 className="h-2.5 w-2.5" style={{ color: "#ff6b35" }} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>+{dayEvents.length - 2} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Events Sidebar */}
        <motion.div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(16px)" }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-xs font-mono tracking-widest mb-4" style={{ color: "#a855f7" }}>// UPCOMING (30 DAYS)</p>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 rounded-full border-2" style={{ borderColor: "rgba(168,85,247,0.3)", borderTopColor: "#a855f7" }} />
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-xs font-mono text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>No upcoming events in the next 30 days</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {upcoming.map(ev => {
                const style = getTypeStyle(ev.event_type);
                return (
                  <div key={ev.id} className="p-3 rounded-xl" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-bold truncate" style={{ color: style.color }}>{ev.title}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {ev.start_date}{ev.end_date && ev.end_date !== ev.start_date ? ` → ${ev.end_date}` : ""}
                        </p>
                        {ev.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: "rgba(255,255,255,0.5)" }}>{ev.description}</p>}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={(e) => openEdit(ev, e)}><Edit className="h-3.5 w-3.5 hover:opacity-70" style={{ color: "#00f5ff" }} /></button>
                          <button onClick={(e) => handleDelete(ev.id, e)}><Trash2 className="h-3.5 w-3.5 hover:opacity-70" style={{ color: "#ff6b35" }} /></button>
                        </div>
                      )}
                    </div>
                    <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.2)", color: style.color }}>{ev.applicable_to}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" style={{ background: "#0d1b2a", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }}>
          <DialogHeader>
            <DialogTitle className="font-mono" style={{ color: "#00f5ff" }}>{editId ? "EDIT EVENT" : "ADD EVENT"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>TITLE *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }} />
            </div>
            <div>
              <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>EVENT TYPE</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger className="mt-1 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>START DATE *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="mt-1 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }} />
              </div>
              <div>
                <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>END DATE</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="mt-1 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>APPLICABLE TO</Label>
              <Select value={form.applicable_to} onValueChange={v => setForm(p => ({ ...p, applicable_to: v }))}>
                <SelectTrigger className="mt-1 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="specific_class">Specific Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.applicable_to === "specific_class" && (
              <div>
                <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>CLASS</Label>
                <Input value={form.specific_class} onChange={e => setForm(p => ({ ...p, specific_class: e.target.value }))} className="mt-1 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }} placeholder="e.g. Class 10" />
              </div>
            )}
            <div>
              <Label className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>DESCRIPTION</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 font-mono resize-none" rows={3} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,255,0.2)", color: "#fff" }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} style={{ color: "rgba(255,255,255,0.5)" }}>Cancel</Button>
            <Button onClick={handleSave} className="font-mono" style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>SAVE EVENT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}