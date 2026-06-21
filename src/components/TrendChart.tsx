import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useState } from 'react';

type TrendMetric = 'twist' | 'breakRisk' | 'uniformity';

const METRIC_CONFIG: Record<TrendMetric, { label: string; color: string; unit: string; domain: [number, number] }> = {
  twist: { label: '捻度', color: '#a78bfa', unit: '捻/m', domain: [0, 1200] },
  breakRisk: { label: '断线风险', color: '#ef4444', unit: '%', domain: [0, 100] },
  uniformity: { label: '均匀度', color: '#22c55e', unit: '分', domain: [0, 100] },
};

export default function TrendChart() {
  const { experiments, params } = useYarnStore();
  const [metric, setMetric] = useState<TrendMetric>('twist');

  const sortedExperiments = useMemo(
    () => [...experiments].sort((a, b) => a.createdAt - b.createdAt),
    [experiments]
  );

  const currentMetrics = useMemo(() => calculateYarnMetrics(params), [params]);

  const trendData = useMemo(() => {
    const saved = sortedExperiments.map((exp, idx) => ({
      index: idx + 1,
      name: exp.name.length > 8 ? exp.name.slice(0, 8) + '..' : exp.name,
      twist: exp.metrics.twist,
      breakRisk: exp.metrics.breakRisk,
      uniformity: exp.metrics.uniformity,
      twistLevel: exp.metrics.twistLevel,
      createdAt: exp.createdAt,
      isCurrent: false,
    }));
    const current = {
      index: saved.length + 1,
      name: '当前方案',
      twist: currentMetrics.twist,
      breakRisk: currentMetrics.breakRisk,
      uniformity: currentMetrics.uniformity,
      twistLevel: currentMetrics.twistLevel,
      createdAt: Date.now(),
      isCurrent: true,
    };
    return [...saved, current];
  }, [sortedExperiments, currentMetrics]);

  const config = METRIC_CONFIG[metric];

  if (trendData.length < 2) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-5 bg-violet-400 rounded-full"></span>
          实验趋势分析
        </h2>
        <div className="h-48 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <TrendingUp size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">保存至少1组实验后可查看趋势</p>
            <p className="text-xs mt-1">趋势将包含当前方案与历史实验对比</p>
          </div>
        </div>
      </div>
    );
  }

  const twistDistribution = {
    low: trendData.filter((e) => e.twistLevel === 'low').length,
    optimal: trendData.filter((e) => e.twistLevel === 'optimal').length,
    high: trendData.filter((e) => e.twistLevel === 'high').length,
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-5 bg-violet-400 rounded-full"></span>
          实验趋势分析
          <span className="text-sm font-normal text-slate-400">
            ({trendData.length} 组)
          </span>
        </h2>

        <div className="flex bg-slate-700/50 rounded-lg p-0.5">
          {(Object.keys(METRIC_CONFIG) as TrendMetric[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                metric === key
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {(['low', 'optimal', 'high'] as const).map((level) => {
          const count = twistDistribution[level];
          if (count === 0) return null;
          return (
            <span
              key={level}
              className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
              style={{ backgroundColor: `${TWIST_LEVEL_COLORS[level]}20`, color: TWIST_LEVEL_COLORS[level] }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TWIST_LEVEL_COLORS[level] }} />
              {TWIST_LEVEL_LABELS[level]}: {count}
            </span>
          );
        })}
        <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 bg-violet-500/20 text-violet-300">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />当前方案
        </span>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={10}
              tick={({ x, y, payload }) => {
                const entry = trendData[payload.index];
                const color = entry?.isCurrent
                  ? '#a78bfa'
                  : entry
                    ? TWIST_LEVEL_COLORS[entry.twistLevel]
                    : '#64748b';
                return (
                  <text x={x} y={y + 12} textAnchor="middle" fill={color} fontSize={9} fontWeight={entry?.isCurrent ? 'bold' : '500'}>
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={config.domain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f1f5f9',
              }}
              formatter={(value: number) => [`${value} ${config.unit}`, config.label]}
              labelFormatter={(_, payload) => {
                if (!payload || payload.length === 0) return '';
                const entry = payload[0]?.payload;
                if (!entry) return '';
                const d = new Date(entry.createdAt);
                const twistLabel = TWIST_LEVEL_LABELS[entry.twistLevel];
                const currentTag = entry.isCurrent ? ' · 当前方案' : '';
                return `${entry.name} (${twistLabel}${currentTag}) · ${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              }}
            />
            {metric === 'twist' && (
              <>
                <ReferenceLine y={300} stroke="#0284C7" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={800} stroke="#D97706" strokeDasharray="3 3" strokeWidth={1} />
              </>
            )}
            {metric === 'breakRisk' && (
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
            )}
            {metric === 'uniformity' && (
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
            )}
            <Line
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            >
              {trendData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isCurrent ? '#a78bfa' : TWIST_LEVEL_COLORS[entry.twistLevel]}
                  stroke={entry.isCurrent ? '#a78bfa' : TWIST_LEVEL_COLORS[entry.twistLevel]}
                />
              ))}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {metric === 'twist' && (
        <div className="flex gap-4 mt-2 text-xs flex-wrap">
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-500" /> 低捻界线 (300)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" /> 过捻界线 (800)
          </span>
          <span className="flex items-center gap-1 text-violet-400">
            <span className="w-2 h-2 rounded-full bg-violet-400" /> 当前方案
          </span>
        </div>
      )}
    </div>
  );
}
