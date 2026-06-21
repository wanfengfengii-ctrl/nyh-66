import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import { TWIST_LEVEL_COLORS, BREAK_RISK_THRESHOLD, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { Activity, AlertTriangle, Sparkles } from 'lucide-react';

export default function MetricCards() {
  const { params, playback, getPlaybackMetrics } = useYarnStore();
  const baseMetrics = useMemo(() => calculateYarnMetrics(params), [params]);
  const isPlaybackMode = playback.isPlaying || playback.isPaused;
  const playbackMetrics = isPlaybackMode ? getPlaybackMetrics() : null;
  const displayMetrics = playbackMetrics || baseMetrics;

  const twistColor = TWIST_LEVEL_COLORS[displayMetrics.twistLevel];
  const isBreakHigh = displayMetrics.breakRisk >= BREAK_RISK_THRESHOLD;
  const isBreakMedium = displayMetrics.breakRisk >= 40 && !isBreakHigh;

  const twistSubtextColor = displayMetrics.twistLevel === 'low' ? 'text-sky-400' : displayMetrics.twistLevel === 'optimal' ? 'text-emerald-400' : 'text-amber-400';

  const cards = [
    {
      label: '捻度',
      value: displayMetrics.twist.toFixed(1),
      unit: '捻/m',
      icon: Activity,
      color: twistColor,
      bgColor: 'from-teal-500/20 to-cyan-500/10',
      borderColor: 'border-teal-500/30',
      subtext: TWIST_LEVEL_LABELS[displayMetrics.twistLevel],
      subtextColor: twistSubtextColor,
    },
    {
      label: '断线风险',
      value: displayMetrics.breakRisk.toString(),
      unit: '%',
      icon: AlertTriangle,
      color: isBreakHigh ? '#ef4444' : isBreakMedium ? '#eab308' : '#22c55e',
      bgColor: isBreakHigh ? 'from-red-500/20 to-orange-500/10' : isBreakMedium ? 'from-yellow-500/20 to-amber-500/10' : 'from-emerald-500/20 to-green-500/10',
      borderColor: isBreakHigh ? 'border-red-500/30' : isBreakMedium ? 'border-yellow-500/30' : 'border-emerald-500/30',
      subtext: isBreakHigh ? '危险' : isBreakMedium ? '注意' : '安全',
      subtextColor: isBreakHigh ? 'text-red-400' : isBreakMedium ? 'text-yellow-400' : 'text-emerald-400',
      highlight: isBreakHigh,
    },
    {
      label: '均匀度',
      value: displayMetrics.uniformity.toString(),
      unit: '分',
      icon: Sparkles,
      color: displayMetrics.uniformity >= 70 ? '#22c55e' : displayMetrics.uniformity >= 50 ? '#eab308' : '#ef4444',
      bgColor: displayMetrics.uniformity >= 70 ? 'from-emerald-500/20 to-green-500/10' : displayMetrics.uniformity >= 50 ? 'from-yellow-500/20 to-amber-500/10' : 'from-red-500/20 to-orange-500/10',
      borderColor: displayMetrics.uniformity >= 70 ? 'border-emerald-500/30' : displayMetrics.uniformity >= 50 ? 'border-yellow-500/30' : 'border-red-500/30',
      subtext: displayMetrics.uniformity >= 80 ? '优秀' : displayMetrics.uniformity >= 60 ? '良好' : '一般',
      subtextColor: displayMetrics.uniformity >= 80 ? 'text-emerald-400' : displayMetrics.uniformity >= 60 ? 'text-yellow-400' : 'text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.bgColor} backdrop-blur-sm rounded-xl p-4 border ${card.borderColor} transition-all duration-300 hover:scale-[1.02] ${card.highlight ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">{card.label}</span>
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <Icon size={14} style={{ color: card.color }} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-3xl font-bold tabular-nums ${card.highlight ? 'text-red-400' : 'text-white'}`}
                style={{ color: card.highlight ? '#f87171' : undefined }}
              >
                {card.value}
              </span>
              <span className="text-slate-400 text-sm">{card.unit}</span>
            </div>
            <div className={`mt-1 text-xs font-medium ${card.subtextColor}`}>
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
