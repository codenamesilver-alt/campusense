import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchAll, fetchAllFiltered } from '@/lib/fetchAll';

const FeeCollectionWidget = () => {
  const [feeData, setFeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [transactions, dueFees] = await Promise.all([
          fetchAllFiltered('FeeTransaction', { status: 'completed' }),
          fetchAll('FeeDue')
      ]);

      const collectedTotal = transactions.reduce((sum, t) => sum + (t.net_amount || 0), 0);
      const pendingTotal = dueFees
        .filter(d => d.status === 'pending' || d.status === 'partially_paid' || d.status === 'overdue')
        .reduce((sum, d) => sum + (d.balance_amount || 0), 0);

      setFeeData([
        { name: 'Collected', value: collectedTotal, fill: '#00ff88' },
        { name: 'Pending', value: pendingTotal, fill: '#f59e0b' },
      ]);
    } catch (error) {
      console.error('Error fetching fee data:', error);
      setFeeData([
        { name: 'Collected', value: 0, fill: '#00ff88' },
        { name: 'Pending', value: 0, fill: '#f59e0b' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(245,158,11,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 20px rgba(245,158,11,0.06)'
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <DollarSign className="h-4 w-4" style={{ color: '#f59e0b' }} />
          </div>
          <span className="text-xs font-mono tracking-widest" style={{ color: '#f59e0b' }}>// FEE STATUS</span>
        </div>
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg" style={{ background: 'rgba(245,158,11,0.06)' }} />
        ) : feeData.every(d => d.value === 0) ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-center text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>NO FEE DATA<br />AWAITING TRANSACTIONS...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={feeData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                {feeData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} style={{ filter: `drop-shadow(0 0 4px ${entry.fill})` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default FeeCollectionWidget;