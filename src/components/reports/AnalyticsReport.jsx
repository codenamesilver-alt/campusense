import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Download, TrendingUp, IndianRupee, GraduationCap } from 'lucide-react';

const NEON = { cyan: '#00f5ff', green: '#00ff88', purple: '#a855f7', orange: '#ff6b35', pink: '#ff006e', yellow: '#f59e0b' };
const GRADE_COLORS = [NEON.green, NEON.cyan, NEON.yellow, NEON.orange, NEON.pink, NEON.purple];

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,245,255,0.15)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  padding: '20px'
};

const tooltipStyle = {
  backgroundColor: '#0d1b2a',
  border: '1px solid rgba(0,245,255,0.3)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
  fontFamily: 'monospace'
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AnalyticsReport() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [feeData, setFeeData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendance, transactions, results] = await Promise.all([
        fetchAll('Attendance'),
        fetchAll('FeeTransaction'),
        fetchAll('ExamResult'),
      ]);

      // Attendance trends by month
      const attMap = {};
      attendance.forEach(a => {
        const d = new Date(a.date);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!attMap[key]) attMap[key] = { total: 0, present: 0, month: MONTHS[d.getMonth()], year: d.getFullYear(), monthIndex: d.getMonth() };
        attMap[key].total++;
        if (a.status === 'present') attMap[key].present++;
      });
      const attArr = Object.values(attMap)
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex)
        .slice(-12)
        .map(m => ({
          month: m.month,
          'Attendance %': m.total > 0 ? Math.round((m.present / m.total) * 100) : 0,
          Present: m.present,
          Total: m.total
        }));
      setAttendanceData(attArr);

      // Fee collection by month
      const feeMap = {};
      transactions.forEach(t => {
        const d = new Date(t.transaction_date);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!feeMap[key]) feeMap[key] = { collected: 0, month: MONTHS[d.getMonth()], year: d.getFullYear(), monthIndex: d.getMonth() };
        if (t.status === 'completed') feeMap[key].collected += (t.net_amount || t.total_amount || 0);
      });
      const feeArr = Object.values(feeMap)
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex)
        .slice(-12)
        .map(m => ({ month: m.month, 'Collected (₹)': Math.round(m.collected) }));
      setFeeData(feeArr);

      // Grade distribution
      const gradeMap = {};
      results.forEach(r => {
        const grade = r.grade || 'N/A';
        gradeMap[grade] = (gradeMap[grade] || 0) + 1;
      });
      const gradeArr = Object.entries(gradeMap)
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => b.count - a.count);
      setGradeData(gradeArr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = reportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#0a0e1a', scale: 1.5 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 1.5, canvas.height / 1.5] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 1.5, canvas.height / 1.5);
    pdf.save('school-analytics-report.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{ borderColor: '#00f5ff' }} />
          <p className="text-xs font-mono" style={{ color: '#00f5ff' }}>LOADING ANALYTICS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black font-mono" style={{ color: '#00f5ff', textShadow: '0 0 12px rgba(0,245,255,0.4)' }}>
            SCHOOL ANALYTICS
          </h2>
          <p className="text-xs font-mono mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Visual KPI dashboard — attendance, fees & exam performance
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-semibold transition-all"
          style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', boxShadow: '0 0 12px rgba(0,245,255,0.15)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,245,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,245,255,0.1)'}
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Printable area */}
      <div ref={reportRef} className="space-y-6" style={{ background: '#0a0e1a', padding: '4px' }}>

        {/* Attendance Trend */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#00f5ff' }} />
            </div>
            <span className="font-mono font-bold text-sm" style={{ color: '#00f5ff' }}>// ATTENDANCE TREND (LAST 12 MONTHS)</span>
          </div>
          {attendanceData.length === 0 ? (
            <p className="text-center text-xs font-mono py-10" style={{ color: 'rgba(255,255,255,0.3)' }}>NO ATTENDANCE DATA AVAILABLE</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={attendanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
                <Line type="monotone" dataKey="Attendance %" stroke={NEON.cyan} strokeWidth={2.5} dot={{ r: 4, fill: NEON.cyan }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fee Collection */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
              <IndianRupee className="h-4 w-4" style={{ color: '#00ff88' }} />
            </div>
            <span className="font-mono font-bold text-sm" style={{ color: '#00ff88' }}>// FEE COLLECTION (LAST 12 MONTHS)</span>
          </div>
          {feeData.length === 0 ? (
            <p className="text-center text-xs font-mono py-10" style={{ color: 'rgba(255,255,255,0.3)' }}>NO FEE DATA AVAILABLE</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={feeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, 'Collected']} />
                <Bar dataKey="Collected (₹)" fill={NEON.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grade Distribution */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <GraduationCap className="h-4 w-4" style={{ color: '#a855f7' }} />
            </div>
            <span className="font-mono font-bold text-sm" style={{ color: '#a855f7' }}>// EXAM GRADE DISTRIBUTION</span>
          </div>
          {gradeData.length === 0 ? (
            <p className="text-center text-xs font-mono py-10" style={{ color: 'rgba(255,255,255,0.3)' }}>NO EXAM RESULT DATA AVAILABLE</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={gradeData} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={100} label={({ grade, percent }) => `${grade} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}>
                    {gradeData.map((_, i) => (
                      <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={gradeData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis dataKey="grade" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }} width={30} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {gradeData.map((_, i) => (
                      <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Summary Table */}
        <div style={{ ...cardStyle, border: '1px solid rgba(168,85,247,0.15)' }}>
          <span className="font-mono font-bold text-sm block mb-4" style={{ color: '#a855f7' }}>// GRADE SUMMARY TABLE</span>
          {gradeData.length === 0 ? (
            <p className="text-xs font-mono text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>NO DATA</p>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(168,85,247,0.2)' }}>
                  {['Grade', 'Students', 'Share %'].map(h => (
                    <th key={h} className="py-2 px-3 text-left" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gradeData.map((row, i) => {
                  const total = gradeData.reduce((s, r) => s + r.count, 0);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-2 px-3 font-bold" style={{ color: GRADE_COLORS[i % GRADE_COLORS.length] }}>{row.grade}</td>
                      <td className="py-2 px-3" style={{ color: 'rgba(255,255,255,0.8)' }}>{row.count}</td>
                      <td className="py-2 px-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{((row.count / total) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}