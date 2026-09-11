import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Holiday } from '@/entities/Holiday';
import { ExamSchedule } from '@/entities/ExamSchedule';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const CalendarWidget = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const [holidays, exams] = await Promise.all([
                Holiday.list(),
                ExamSchedule.list()
            ]);

            const holidayEvents = holidays.map(h => ({ 
                date: new Date(h.date), 
                title: h.title, 
                type: h.type 
            }));
            
            const examEvents = exams.map(e => ({ 
                date: new Date(e.exam_date), 
                title: e.subject_name + ' Exam', 
                type: 'examination' 
            }));
            
            setEvents([...holidayEvents, ...examEvents]);
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getEventForDate = (date) => {
        return events.find(event => isSameDay(event.date, date));
    };

    const getEventNeon = (type) => ({
        national_holiday: '#ff006e',
        school_event: '#00f5ff',
        examination: '#f59e0b',
        vacation: '#a855f7',
    }[type] || '#00f5ff');

    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    return (
        <div
          className="rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(168,85,247,0.2)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 0 20px rgba(168,85,247,0.08)'
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Calendar className="h-4 w-4" style={{ color: '#a855f7' }} />
              </div>
              <span className="text-xs font-mono tracking-widest" style={{ color: '#a855f7' }}>// CALENDAR</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => navigateMonth('prev')} className="p-1.5 rounded-lg transition-all" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{format(currentDate, 'MMMM yyyy').toUpperCase()}</span>
              <button onClick={() => navigateMonth('next')} className="p-1.5 rounded-lg transition-all" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-xs font-mono p-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array(monthStart.getDay()).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {calendarDays.map((day, index) => {
                const event = getEventForDate(day);
                const isToday = isSameDay(day, new Date());
                const neon = event ? getEventNeon(event.type) : null;
                return (
                  <div
                    key={index}
                    className="relative h-8 flex items-center justify-center rounded-lg text-xs font-mono cursor-default transition-all"
                    style={{
                      background: isToday ? 'rgba(168,85,247,0.4)' : neon ? `${neon}18` : 'transparent',
                      border: isToday ? '1px solid #a855f7' : neon ? `1px solid ${neon}40` : '1px solid transparent',
                      color: isToday ? '#fff' : neon ? neon : 'rgba(255,255,255,0.55)',
                      boxShadow: isToday ? '0 0 10px rgba(168,85,247,0.5)' : neon ? `0 0 6px ${neon}30` : 'none'
                    }}
                    title={event ? event.title : ''}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[['#ff006e','Holiday'],['#00f5ff','Event'],['#f59e0b','Exam'],['#a855f7','Vacation']].map(([c, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
    );
};

export default CalendarWidget;