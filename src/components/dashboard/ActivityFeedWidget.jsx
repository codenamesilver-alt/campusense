import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, UserPlus, DollarSign } from 'lucide-react';
import { Student } from '@/entities/Student';
import { FeeTransaction } from '@/entities/FeeTransaction';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeedWidget = () => {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [students, payments] = await Promise.all([
        Student.list('-created_date', 3),
        FeeTransaction.list('-transaction_date', 3)
      ]);
      
      const studentActivities = students.map(s => ({
        type: 'admission',
        text: `${s.first_name} ${s.last_name} was admitted to Class ${s.class}-${s.section}.`,
        time: new Date(s.created_date),
        icon: UserPlus,
        color: 'text-blue-500'
      }));

      const paymentActivities = payments.map(p => ({
        type: 'payment',
        text: `Fee payment of ₹${p.total_amount.toLocaleString()} received.`,
        time: new Date(p.transaction_date),
        icon: DollarSign,
        color: 'text-green-500'
      }));

      const combinedFeed = [...studentActivities, ...paymentActivities].sort((a,b) => b.time - a.time);
      setFeed(combinedFeed);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      setFeed([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div
      className="rounded-2xl h-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(168,85,247,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 20px rgba(168,85,247,0.08)'
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <Activity className="h-4 w-4" style={{ color: '#a855f7' }} />
          </div>
          <span className="text-xs font-mono tracking-widest" style={{ color: '#a855f7' }}>// LIVE FEED</span>
        </div>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(168,85,247,0.1)' }} />)}
          </div>
        ) : feed.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-center text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>NO RECENT EVENTS<br />AWAITING DATA STREAM...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-2 rounded-lg flex-shrink-0" style={{
                  background: item.type === 'admission' ? 'rgba(0,245,255,0.1)' : 'rgba(0,255,136,0.1)',
                  border: `1px solid ${item.type === 'admission' ? 'rgba(0,245,255,0.3)' : 'rgba(0,255,136,0.3)'}`
                }}>
                  <item.icon className="h-3.5 w-3.5" style={{ color: item.type === 'admission' ? '#00f5ff' : '#00ff88' }} />
                </div>
                <div>
                  <p className="text-xs text-white leading-snug" style={{ opacity: 0.8 }}>{item.text}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDistanceToNow(item.time, { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedWidget;