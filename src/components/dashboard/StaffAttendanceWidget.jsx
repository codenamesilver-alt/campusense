import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users } from 'lucide-react';
import { StaffAttendance } from '@/entities/StaffAttendance';
import { Staff } from '@/entities/Staff';

const StaffAttendanceWidget = () => {
  const [staffData, setStaffData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [allStaff, todayAttendance] = await Promise.all([
        Staff.list(),
        StaffAttendance.filter({ date: today })
      ]);

      // Group by department
      const departmentData = allStaff.reduce((acc, staff) => {
        const dept = staff.department || 'General';
        if (!acc[dept]) {
          acc[dept] = { name: dept, Present: 0, Absent: 0, total: 0 };
        }
        acc[dept].total++;
        
        const attendance = todayAttendance.find(a => a.staff_id === staff.id);
        if (attendance && attendance.status === 'present') {
          acc[dept].Present++;
        } else {
          acc[dept].Absent++;
        }
        
        return acc;
      }, {});

      setStaffData(Object.values(departmentData));
    } catch (error) {
      console.error('Error fetching staff attendance data:', error);
      setStaffData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,245,255,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 20px rgba(0,245,255,0.06)'
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(0,245,255,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}>
            <Users className="h-4 w-4" style={{ color: '#00f5ff' }} />
          </div>
          <span className="text-xs font-mono tracking-widest" style={{ color: '#00f5ff' }}>// STAFF OPS</span>
        </div>
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,245,255,0.2)', borderTopColor: '#00f5ff' }} />
          </div>
        ) : staffData.length === 0 || staffData.every(d => d.total === 0) ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-center text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>NO STAFF DATA<br />ADD STAFF TO MONITOR...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={staffData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} style={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
              <YAxis allowDecimals={false} fontSize={10} style={{ fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }} />
              <Bar dataKey="Present" stackId="a" fill="#00ff88" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 4px #00ff88)' }} />
              <Bar dataKey="Absent" stackId="a" fill="#ff006e" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 4px #ff006e)' }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default StaffAttendanceWidget;