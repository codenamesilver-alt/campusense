import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UserPlus, FileText, DollarSign, Users, Megaphone, FileBarChart } from 'lucide-react';

const actions = [
  { title: "Add Student", icon: UserPlus, url: "StudentAdmission" },
  { title: "Upload Marks", icon: FileText, url: "ExamResults" },
  { title: "Collect Fees", icon: DollarSign, url: "FeeCollection" },
  { title: "Add Staff", icon: Users, url: "AddStaff" },
  { title: "Announcement", icon: Megaphone, url: "NoticeBoard" },
  { title: "Reports", icon: FileBarChart, url: "StudentReport" }
];

const tileStyles = [
  { neon: '#00f5ff', glow: 'rgba(0,245,255,0.2)' },
  { neon: '#a855f7', glow: 'rgba(168,85,247,0.2)' },
  { neon: '#00ff88', glow: 'rgba(0,255,136,0.2)' },
  { neon: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  { neon: '#ff006e', glow: 'rgba(255,0,110,0.2)' },
  { neon: '#ff6b35', glow: 'rgba(255,107,53,0.2)' },
];

const QuickAccessWidget = () => {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,245,255,0.15)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 20px rgba(0,245,255,0.05)'
      }}
    >
      <p className="text-xs font-mono tracking-widest mb-4" style={{ color: '#00f5ff' }}>// QUICK ACCESS</p>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, i) => {
          const style = tileStyles[i % tileStyles.length];
          return (
            <Link key={action.title} to={createPageUrl(action.url)}>
              <div
                className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105"
                style={{
                  background: `${style.neon}10`,
                  border: `1px solid ${style.neon}30`,
                  boxShadow: `0 0 12px ${style.glow}`
                }}
              >
                <action.icon className="h-5 w-5" style={{ color: style.neon, filter: `drop-shadow(0 0 4px ${style.neon})` }} />
                <span className="text-xs text-center font-mono leading-tight" style={{ color: style.neon }}>{action.title}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccessWidget;