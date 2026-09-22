import React, { useState, useEffect } from "react";
import { usePermissions } from "@/components/auth/PermissionProvider";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

import { Student } from "@/entities/Student";
import { Staff } from "@/entities/Staff";
import { FeeTransaction } from "@/entities/FeeTransaction";
import { Complaint } from "@/entities/Complaint";
import { ApprovalRequest } from "@/entities/ApprovalRequest";
import { Attendance } from "@/entities/Attendance";
import { ExamSchedule } from "@/entities/ExamSchedule";

import KeyMetricCard from "../components/dashboard/KeyMetricCard";
import StudentAttendanceWidget from "../components/dashboard/StudentAttendanceWidget";
import FeeCollectionWidget from "../components/dashboard/FeeCollectionWidget";
import StaffAttendanceWidget from "../components/dashboard/StaffAttendanceWidget";
import NoticeboardWidget from "../components/dashboard/NoticeboardWidget";
import ActivityFeedWidget from "../components/dashboard/ActivityFeedWidget";
import CalendarWidget from "../components/dashboard/CalendarWidget";
import QuickAccessWidget from "../components/dashboard/QuickAccessWidget";
import AttendanceRiskWidget from "../components/dashboard/AttendanceRiskWidget";
import SchoolEventsWidget from "../components/dashboard/SchoolEventsWidget";
import StudentQuickSearch from "../components/dashboard/StudentQuickSearch";

import { Users, Briefcase, IndianRupee, MessageCircleWarning, UserCheck, CalendarClock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    todayFee: 0,
    monthFee: 0,
    openTickets: 0,
    todayAttendance: 0,
    upcomingExam: "None",
    pendingApprovals: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;
        const monthStart = `${yyyy}-${mm}-01`;
        const monthEnd = `${yyyy}-${mm}-${String(new Date(yyyy, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

        const [students, staff, allFeeTransactions, complaints, attendance, examSchedules, approvalRequests] = await Promise.all([
          Student.list(),
          Staff.list(),
          FeeTransaction.list('-transaction_date'),
          Complaint.filter({ status: 'open' }),
          Attendance.filter({ date: today }),
          ExamSchedule.filter({ exam_date: { '$gte': today } }, 'exam_date', 1),
          ApprovalRequest.filter({ status: 'pending' })
        ]);
        const totalStudents = students.length;
        const presentToday = attendance.filter(a => a.status === 'present').length;

        // Today's fee: completed transactions for today
        const todayFee = allFeeTransactions
          .filter(t => t.status === 'completed' && t.transaction_date === today)
          .reduce((sum, t) => sum + Number(t.net_amount || 0), 0);

        // Monthly fee: completed transactions within current month
        const monthFee = allFeeTransactions
          .filter(t => t.status === 'completed' && t.transaction_date >= monthStart && t.transaction_date <= monthEnd)
          .reduce((sum, t) => sum + Number(t.net_amount || 0), 0);

        setStats({
          totalStudents,
          totalStaff: staff.length,
          todayFee,
          monthFee,
          openTickets: complaints.length,
          todayAttendance: totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(0) : 0,
          upcomingExam: examSchedules.length > 0 ? examSchedules[0].subject_name : "None",
          pendingApprovals: approvalRequests.length
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const metricCards = [
    { title: "Total Students", dataKey: "totalStudents", icon: Users, neon: '#00f5ff', glow: 'rgba(0,245,255,0.3)', label: 'STUDENTS' },
    { title: "Total Staff", dataKey: "totalStaff", icon: Briefcase, neon: '#a855f7', glow: 'rgba(168,85,247,0.3)', label: 'STAFF' },
    { title: "Today's Fees", dataKey: "todayFee", icon: IndianRupee, neon: '#00ff88', glow: 'rgba(0,255,136,0.3)', prefix: '₹', label: 'COLLECTED' },
    { title: "Total Fee", dataKey: "monthFee", icon: MessageCircleWarning, neon: '#ff6b35', glow: 'rgba(255,107,53,0.3)', prefix: '₹', label: 'THIS MONTH' },
    { title: "Attendance", dataKey: "todayAttendance", icon: UserCheck, neon: '#f59e0b', glow: 'rgba(245,158,11,0.3)', suffix: '%', label: 'TODAY' },
    { title: "Upcoming Exam", dataKey: "upcomingExam", icon: CalendarClock, neon: '#ff006e', glow: 'rgba(255,0,110,0.3)', label: 'EXAM' },
    { title: "Pending Approvals", dataKey: "pendingApprovals", icon: ShieldCheck, neon: '#ff00e5', glow: 'rgba(255,0,229,0.3)', label: 'REQUESTS' }
  ];

  const formatValue = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toLocaleString('en-IN');
    }
    return value || 0;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a0e1a 100%)' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0
      }} />

      <div className="relative z-10">
        {/* Hero Banner */}
        <motion.div
          className="relative overflow-hidden rounded-2xl mb-6 p-6"
          style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1) 0%, rgba(168,85,247,0.15) 50%, rgba(0,255,136,0.08) 100%)', border: '1px solid rgba(0,245,255,0.2)', backdropFilter: 'blur(20px)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)', transform: 'translate(-40%, -40%)' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                <span className="text-xs font-mono tracking-widest" style={{ color: '#00f5ff' }}>SYSTEM ONLINE</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-1" style={{ textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
                CAMPUSENSE <span style={{ color: '#00f5ff' }}>HQ</span>
              </h1>
              <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                ADMIN CONTROL PANEL &mdash; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-mono font-black" style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.6)' }}>
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>LOCAL TIME &mdash; IST</p>
            </div>
          </div>
        </motion.div>

        {/* Student Quick Search */}
        <StudentQuickSearch />

        {/* Key Metrics */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {metricCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.04, y: -4 }}
            >
              <KeyMetricCard
                title={card.title}
                value={`${card.prefix || ''}${formatValue(stats[card.dataKey])}${card.suffix || ''}`}
                icon={card.icon}
                neon={card.neon}
                glow={card.glow}
                label={card.label}
                isLoading={isLoading}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="md:col-span-1"><StudentAttendanceWidget /></div>
              <div className="md:col-span-1"><FeeCollectionWidget /></div>
              <div className="md:col-span-1"><StaffAttendanceWidget /></div>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <NoticeboardWidget />
              <ActivityFeedWidget />
            </motion.div>
          </div>
          <motion.div
            className="lg:col-span-1 space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CalendarWidget />
            <AttendanceRiskWidget />
            <SchoolEventsWidget />
            <QuickAccessWidget />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0e1a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: '#00f5ff' }}></div>
          <p className="mt-4 font-mono text-sm" style={{ color: '#00f5ff' }}>LOADING SYSTEM...</p>
        </div>
      </div>
    );
  }

  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
    default:
      return <AdminDashboard />;
  }
}