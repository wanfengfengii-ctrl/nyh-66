import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { TWIST_LEVEL_COLORS } from '@/utils/constants';
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
} from 'recharts';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';
import { useState } from 'react';

type ChartType = 'bar' | 'radar';

export default function CompareChart() {
  const { experiments, selectedIds } = useYarnStore();
  const [chartType, setChartType] = useState<ChartType>('bar');

  const selectedExperiments = useMemo(
    () => experiments.filter((e) => selectedIds.includes(e.id)),
    [experiments, selectedIds]
  );

  const barData = useMemo(() => {
    return selectedExperiments.map((exp) => ({
      name: exp.name.length > 6 ? exp.name.slice(0, 6) + '...' : exp.name,
      捻度: exp.metrics.twist,
      断线风险: exp.metrics.breakRisk,
      均匀度: exp.metrics.uniformity,
      twistLevel: exp.metrics.twistLevel,
      color: TWIST_LEVEL_COLORS[exp.metrics.twistLevel],
    }));
  }, [selectedExperiments]);

  const radarData = useMemo(() => {
    const metrics = [
      { key: 'twist', label: '捻度', max: 1200 },
      { key: 'breakRisk', label: '断线风险', max: 100 },
      { key: 'uniformity', label: '均匀度', max: 100 },
      { key: 'spindleSpeed', label: '转速', max: 300 },
      { key: 'draftSpeed', label: '牵伸', max: 20 },
    ];

    return metrics.map((m) => {
      const item: Record<string, unknown> = { metric: m.label };
      selectedExperiments.forEach((exp) => {
        let value = 0;
        if (m.key === 'twist') value = exp.metrics.twist;
        else if (m.key === 'breakRisk') value = exp.metrics.breakRisk;
        else if (m.key === 'uniformity') value = exp.metrics.uniformity;
        else if (m.key === 'spindleSpeed') value = exp.params.spindleSpeed;
        else if (m.key === 'draftSpeed') value = exp.params.draftSpeed;

        item[exp.name] = Math.round((value / m.max) * 100);
      });
      return item;
    });
  }, [selectedExperiments]);

  if (selectedExperiments.length === 0) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-violet-500 rounded-full"></span>
          方案对比
        </h2>
        <div className="h-64 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <BarChart3 size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">选择实验方案进行对比</p>
            <p className="text-xs mt-1">点击左侧方案列表中的方案</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-violet-500 rounded-full"></span>
          方案对比
          <span className="text-sm font-normal text-slate-400">
            ({selectedExperiments.length} 个方案)
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
        {selectedExperiments.map((exp) => (
          <span
            key={exp.id}
            className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: `${TWIST_LEVEL_COLORS[exp.metrics.twistLevel]}20`,
              color: TWIST_LEVEL_COLORS[exp.metrics.twistLevel],
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TWIST_LEVEL_COLORS[exp.metrics.twistLevel] }}
            />
            {exp.name}
          </span>
        ))}
      </div>

      <div className="h-64">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
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
              <Bar dataKey="捻度" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="断线风险" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="均匀度" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
              {selectedExperiments.map((exp, index) => {
                const colors = ['#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                return (
                  <Radar
                    key={exp.id}
                    name={exp.name}
                    dataKey={exp.name}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                );
              })}
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <h4 className="text-sm font-medium text-white mb-2">捻度状态分布</h4>
        <div className="flex gap-4">
          {(['low', 'optimal', 'high'] as const).map((level) => {
            const count = selectedExperiments.filter(
              (e) => e.metrics.twistLevel === level
            ).length;
            const percentage = selectedExperiments.length > 0
              ? Math.round((count / selectedExperiments.length) * 100)
              : 0;
            const labels = { low: '低捻', optimal: '适中', high: '过捻' };

            return (
              <div key={level} className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">{labels[level]}</span>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
