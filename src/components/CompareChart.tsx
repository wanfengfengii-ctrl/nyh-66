import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';
import { useState } from 'react';
import type { TwistLevel } from '@/types';

type ChartType = 'bar' | 'radar';

interface ChartEntry {
  name: string;
  twistLevel: TwistLevel;
  捻度: number;
  断线风险: number;
  均匀度: number;
  isCurrent?: boolean;
}

export default function CompareChart() {
  const { params, experiments, selectedIds } = useYarnStore();
  const [chartType, setChartType] = useState<ChartType>('bar');

  const currentMetrics = useMemo(() => calculateYarnMetrics(params), [params]);

  const selectedExperiments = useMemo(
    () => experiments.filter((e) => selectedIds.includes(e.id)),
    [experiments, selectedIds]
  );

  const allEntries: ChartEntry[] = useMemo(() => {
    const current: ChartEntry = {
      name: '当前方案',
      twistLevel: currentMetrics.twistLevel,
      捻度: currentMetrics.twist,
      断线风险: currentMetrics.breakRisk,
      均匀度: currentMetrics.uniformity,
      isCurrent: true,
    };

    const saved: ChartEntry[] = selectedExperiments.map((exp) => ({
      name: exp.name.length > 6 ? exp.name.slice(0, 6) + '...' : exp.name,
      twistLevel: exp.metrics.twistLevel,
      捻度: exp.metrics.twist,
      断线风险: exp.metrics.breakRisk,
      均匀度: exp.metrics.uniformity,
    }));

    return [current, ...saved];
  }, [currentMetrics, selectedExperiments]);

  const barData = useMemo(() => allEntries, [allEntries]);

  const radarData = useMemo(() => {
    const metricDefs = [
      { key: 'twist', label: '捻度', max: 1200 },
      { key: 'breakRisk', label: '断线风险', max: 100 },
      { key: 'uniformity', label: '均匀度', max: 100 },
      { key: 'spindleSpeed', label: '转速', max: 300 },
      { key: 'draftSpeed', label: '牵伸', max: 20 },
    ];

    return metricDefs.map((m) => {
      const item: Record<string, unknown> = { metric: m.label };
      allEntries.forEach((entry, entryIdx) => {
        let value = 0;
        if (m.key === 'twist') value = entry.捻度;
        else if (m.key === 'breakRisk') value = entry.断线风险;
        else if (m.key === 'uniformity') value = entry.均匀度;
        else if (m.key === 'spindleSpeed') {
          if (entry.isCurrent) {
            value = params.spindleSpeed;
          } else {
            const originalIdx = entryIdx - 1;
            if (selectedExperiments[originalIdx]) {
              value = selectedExperiments[originalIdx].params.spindleSpeed;
            }
          }
        }
        else if (m.key === 'draftSpeed') {
          if (entry.isCurrent) {
            value = params.draftSpeed;
          } else {
            const originalIdx = entryIdx - 1;
            if (selectedExperiments[originalIdx]) {
              value = selectedExperiments[originalIdx].params.draftSpeed;
            }
          }
        }

        item[entry.name] = Math.round((value / m.max) * 100);
      });
      return item;
    });
  }, [allEntries, params, selectedExperiments]);

  const radarColors = useMemo(() => {
    return allEntries.map((entry) => {
      if (entry.isCurrent) return '#a78bfa';
      return TWIST_LEVEL_COLORS[entry.twistLevel];
    });
  }, [allEntries]);

  const hasData = allEntries.length > 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: ChartEntry }>; label?: string }) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0]?.payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">{label}</span>
          {entry && (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${TWIST_LEVEL_COLORS[entry.twistLevel]}30`,
                color: TWIST_LEVEL_COLORS[entry.twistLevel],
              }}
            >
              {TWIST_LEVEL_LABELS[entry.twistLevel]}
            </span>
          )}
          {entry?.isCurrent && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-500/30 text-violet-300">
              实时
            </span>
          )}
        </div>
        {payload.map((p) => (
          <div key={p.name} className="text-slate-300">
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  if (!hasData) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-violet-500 rounded-full"></span>
          方案对比
        </h2>
        <div className="h-64 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <BarChart3 size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">调整参数后自动显示当前方案</p>
            <p className="text-xs mt-1">保存并选择更多方案进行对比</p>
          </div>
        </div>
      </div>
    );
  }

  const totalEntries = allEntries.length;
  const twistDistribution = (['low', 'optimal', 'high'] as const).map((level) => {
    const count = allEntries.filter((e) => e.twistLevel === level).length;
    return { level, count, percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0 };
  });

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-violet-500 rounded-full"></span>
          方案对比
          <span className="text-sm font-normal text-slate-400">
            ({totalEntries} 个方案)
          </span>
        </h2>

        <div className="flex bg-slate-700/50 rounded-lg p-0.5">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              chartType === 'bar'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            柱状图
          </button>
          <button
            onClick={() => setChartType('radar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              chartType === 'radar'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RadarIcon size={14} />
            雷达图
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {allEntries.map((entry, idx) => {
          const color = entry.isCurrent ? '#a78bfa' : TWIST_LEVEL_COLORS[entry.twistLevel];
          const label = TWIST_LEVEL_LABELS[entry.twistLevel];
          return (
            <span
              key={idx}
              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {entry.name}
              <span className="opacity-70">({label})</span>
              {entry.isCurrent && <span className="text-violet-300 opacity-70">●</span>}
            </span>
          );
        })}
      </div>

      <div className="h-64">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tick={({ x, y, payload }) => {
                  const entry = barData[payload.index];
                  const color = entry?.isCurrent ? '#a78bfa' : TWIST_LEVEL_COLORS[entry?.twistLevel || 'optimal'];
                  const label = entry ? TWIST_LEVEL_LABELS[entry.twistLevel] : '';
                  return (
                    <g>
                      <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={11} fontWeight="600">
                        {payload.value}
                      </text>
                      <text x={x} y={y + 26} textAnchor="middle" fill={color} fontSize={9} opacity={0.7}>
                        {label}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="捻度" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isCurrent ? '#8b5cf6' : TWIST_LEVEL_COLORS[entry.twistLevel]}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
              <Bar dataKey="断线风险" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.断线风险 >= 70 ? '#ef4444' : entry.断线风险 >= 40 ? '#eab308' : '#22c55e'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
              <Bar dataKey="均匀度" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.均匀度 >= 70 ? '#22c55e' : entry.均匀度 >= 50 ? '#eab308' : '#ef4444'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={11} />
              <PolarRadiusAxis stroke="#475569" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              {allEntries.map((entry, index) => (
                <Radar
                  key={index}
                  name={`${entry.name}(${TWIST_LEVEL_LABELS[entry.twistLevel]})`}
                  dataKey={entry.name}
                  stroke={radarColors[index]}
                  fill={radarColors[index]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  strokeDasharray={entry.isCurrent ? '5 3' : undefined}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <h4 className="text-sm font-medium text-white mb-2">捻度状态分布</h4>
        <div className="flex gap-4">
          {twistDistribution.map(({ level, count, percentage }) => (
            <div key={level} className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span
                  className="font-medium flex items-center gap-1"
                  style={{ color: TWIST_LEVEL_COLORS[level] }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TWIST_LEVEL_COLORS[level] }}
                  />
                  {TWIST_LEVEL_LABELS[level]}
                </span>
                <span className="text-white font-medium">{count}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: TWIST_LEVEL_COLORS[level],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
