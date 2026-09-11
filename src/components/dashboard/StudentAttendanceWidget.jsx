import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck } from 'lucide-react';
import { Student } from '@/entities/Student';
import { Attendance } from '@/entities/Attendance';
import { Class } from '@/entities/Class';

const COLORS = ['#00ff88', '#ff006e']; // Green for Present, Red for Absent

const StudentAttendanceWidget = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const classData = await Class.list('numeric_value');
      setClasses(classData);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRecords = await Attendance.filter({ date: today });
      let relevantStudents = await Student.list();
      
      if(selectedClass !== 'all') {
        relevantStudents = relevantStudents.filter(s => s.class === selectedClass);
      }
      
      const presentCount = attendanceRecords.filter(a => a.status === 'present' && relevantStudents.some(s => s.id === a.student_id)).length;
      const totalStudents = relevantStudents.length;
      const absentCount = totalStudents - presentCount;

      setAttendanceData([
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount },
      ]);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,255,136,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 20px rgba(0,255,136,0.06)'
      }}
    >
      <div className="p-4 flex flex-col gap-2 border-b" style={{ borderColor: 'rgba(0,255,136,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <UserCheck className="h-4 w-4" style={{ color: '#00ff88' }} />
          </div>
          <span className="text-xs font-mono tracking-widest" style={{ color: '#00ff88' }}>// ATTENDANCE</span>
        </div>
        <Select defaultValue="all" onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full h-7 text-xs font-mono" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-24 h-24 rounded-full animate-pulse" style={{ background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.2)' }} />
          </div>
        ) : attendanceData.length === 0 || attendanceData.every(d => d.value === 0) ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-center text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>NO DATA AVAILABLE<br/>AWAITING INPUT...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={attendanceData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]})` }} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceWidget;