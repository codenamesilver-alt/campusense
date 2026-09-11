import { Skeleton } from "@/components/ui/skeleton";

const KeyMetricCard = ({ title, value, icon: Icon, neon = '#00f5ff', glow = 'rgba(0,245,255,0.3)', label, isLoading }) => {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-default"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${neon}40`,
        backdropFilter: 'blur(16px)',
        boxShadow: `0 0 20px ${glow}, inset 0 0 20px rgba(255,255,255,0.02)`
      }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12" style={{
        background: `linear-gradient(135deg, transparent 50%, ${neon}20 50%)`
      }} />
      {/* Glowing dot */}
      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: neon, boxShadow: `0 0 6px ${neon}` }} />

      <div className="mb-3">
        <div className="inline-flex p-2 rounded-lg" style={{ background: `${neon}15`, border: `1px solid ${neon}30` }}>
          <Icon className="h-4 w-4" style={{ color: neon }} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-20 mb-1" style={{ background: `${neon}20` }} />
      ) : (
        <p className="text-2xl font-black font-mono mb-0.5" style={{ color: neon, textShadow: `0 0 12px ${neon}80` }}>{value}</p>
      )}
      <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{label || title}</p>
    </div>
  );
};

export default KeyMetricCard;