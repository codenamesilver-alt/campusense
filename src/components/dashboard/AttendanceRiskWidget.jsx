import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fetchAllFiltered } from "@/lib/fetchAll";
import { AlertTriangle, RefreshCw, UserX } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendanceRiskWidget() {
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    const data = await fetchAllFiltered('StudentAttendanceInsight', { is_at_risk: true }, '-attendance_percentage');
    setAtRiskStudents(data);
    if (data.length > 0) setLastUpdated(data[0].last_calculated);
    setIsLoading(false);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await base44.functions.invoke("calculateAttendanceInsights", {});
    await fetchInsights();
    setIsRecalculating(false);
  };

  useEffect(() => { fetchInsights(); }, []);

  const getRiskColor = (pct) => {
    if (pct < 50) return { color: '#ff006e', bg: 'rgba(255,0,110,0.12)', border: 'rgba(255,0,110,0.3)' };
    if (pct < 65) return { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.3)' };
    return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
  };

  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,107,53,0.25)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <AlertTriangle className="h-4 w-4" style={{ color: '#ff6b35' }} />
          </div>
          <div>
            <p className="text-sm font-black font-mono" style={{ color: '#ff6b35' }}>ATTENDANCE RISK</p>
            <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {lastUpdated ? `Updated: ${lastUpdated}` : 'Below 75% threshold'}
            </p>
          </div>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="p-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}
          title="Recalculate now"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} style={{ color: '#ff6b35' }} />
        </button>
      </div>

      {/* Alert Banner */}
      {!isLoading && atRiskStudents.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)' }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff6b35', boxShadow: '0 0 6px #ff6b35' }} />
          <p className="text-xs font-mono" style={{ color: '#ff6b35' }}>
            {atRiskStudents.length} student{atRiskStudents.length > 1 ? 's' : ''} require{atRiskStudents.length === 1 ? 's' : ''} immediate attention
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-5 w-5 rounded-full border-2" style={{ borderColor: 'rgba(255,107,53,0.3)', borderTopColor: '#ff6b35' }} />
        </div>
      ) : atRiskStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="p-3 rounded-full" style={{ background: 'rgba(0,255,136,0.08)' }}>
            <UserX className="h-6 w-6" style={{ color: '#00ff88' }} />
          </div>
          <p className="text-xs font-mono text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {base44.entities?.StudentAttendanceInsight ? 'All students are above 75%' : 'Click refresh to calculate'}
          </p>
          <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>Click ↻ to recalculate</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {atRiskStudents.map((s) => {
            const risk = getRiskColor(s.attendance_percentage);
            return (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: risk.bg, border: `1px solid ${risk.border}` }}>
                <div className="min-w-0">
                  <p className="text-xs font-mono font-bold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{s.student_name}</p>
                  <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Class {s.class}{s.section ? ` - ${s.section}` : ''} &nbsp;·&nbsp; {s.total_days_present}/{s.total_days_counted} days
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-sm font-black font-mono" style={{ color: risk.color }}>{s.attendance_percentage}%</span>
                  <span className="text-[9px] font-mono" style={{ color: risk.color, opacity: 0.7 }}>AT RISK</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}