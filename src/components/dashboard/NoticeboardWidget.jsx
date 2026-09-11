import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Pin } from 'lucide-react';
import { Notice } from '@/entities/Notice';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const NoticeboardWidget = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const noticeData = await Notice.filter({ status: 'published' }, '-created_date', 5);
      setNotices(noticeData.sort((a, b) => b.pinned - a.pinned));
    } catch (error) {
      console.error('Error fetching notices:', error);
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPriorityColor = (priority) => ({
    urgent: 'bg-red-500', high: 'bg-orange-500',
    medium: 'bg-yellow-500', low: 'bg-blue-500'
  }[priority]);

  return (
    <div
      className="rounded-2xl h-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,245,255,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 20px rgba(0,245,255,0.08)'
      }}
    >
      <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,245,255,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}>
            <Bell className="h-4 w-4" style={{ color: '#00f5ff' }} />
          </div>
          <span className="text-xs font-mono tracking-widest" style={{ color: '#00f5ff' }}>// NOTICEBOARD</span>
        </div>
        <Link to={createPageUrl('NoticeBoard')}>
          <button className="text-xs font-mono px-3 py-1 rounded-lg transition-all" style={{ color: '#00f5ff', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }}>VIEW ALL</button>
        </Link>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'rgba(0,245,255,0.06)' }} />)}
          </div>
        ) : notices.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-center text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>NO ACTIVE NOTICES<br />CHANNEL CLEAR...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map(notice => {
              const neonMap = { urgent: '#ff006e', high: '#ff6b35', medium: '#f59e0b', low: '#00f5ff' };
              const neon = neonMap[notice.priority] || '#00f5ff';
              return (
                <div key={notice.id} className="flex items-start gap-3 p-3 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${neon}20` }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 animate-pulse" style={{ background: neon, boxShadow: `0 0 6px ${neon}` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{notice.title}</p>
                      {notice.pinned && <Pin className="h-3 w-3 flex-shrink-0" style={{ color: neon }} />}
                    </div>
                    <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{notice.content}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{notice.publish_date ? format(new Date(notice.publish_date), 'dd/MM/yyyy') : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeboardWidget;