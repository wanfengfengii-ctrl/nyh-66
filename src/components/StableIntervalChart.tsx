import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateStableIntervals } from '@/utils/calculations';
import { PARAM_RANGES, TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function StableIntervalChart() {
  const { params } = useYarnStore();

  const intervals = useMemo(() => calculateStableIntervals(params), [params]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-5 bg-emerald-400 rounded-full"></span>
        稳定区间可视化
      </h2>

      <div className="space-y-5">
        {intervals.map((interval) => {
          const range = PARAM_RANGES[interval.param];
          const currentVal = params[interval.param];
          const currentPoint = interval.points[interval.currentIdx];

          const chartData = interval.points.map((p) => ({
            value: p.value,
            breakRisk: p.breakRisk,
            uniformity: p.uniformity,
            isFeasible: p.isFeasible,
            twistLevel: p.twistLevel,
          }));

          const feasiblePoints = interval.points.filter((p) => p.isFeasible);
          const feasibleRange = feasiblePoints.length >= 2
            ? `${feasiblePoints[0].value} ~ ${feasiblePoints[feasiblePoints.length - 1].value}`
            : currentPoint?.isFeasible
              ? `${currentVal}`
              : '无';

          return (
            <div key={interval.param}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-white">{range.label}</span>
                  <span className="text-xs text-slate-500">
                    当前: <span className="text-teal-400 font-medium">{currentVal}{range.unit === 'm/min' ? '' : ''} {range.unit}</span>
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  稳定区间: <span className={currentPoint?.isFeasible ? 'text-emerald-400' : 'text-red-400'}>
                    {feasibleRange} {range.unit}
                  </span>
                </span>
              </div>

              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id={`riskGrad-${interval.param}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id={`unifGrad-${interval.param}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="value"
                      stroke="#64748b"
                      fontSize={9}
                      tickFormatter={(v: number) => interval.param === 'draftSpeed' ? v.toFixed(1) : v.toString()}
                    />
                    <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#f1f5f9',
                      }}
                      formatter={(value: number, name: string) => {
                        const label = name === 'breakRisk' ? '断线风险' : '均匀度';
                        return [`${value}`, label];
                      }}
                      labelFormatter={(label: number) => {
                        const step = interval.param === 'draftSpeed' ? label.toFixed(1) : label;
                        return `${range.label}: ${step} ${range.unit}`;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="breakRisk"
                      stroke="#ef4444"
                      fill={`url(#riskGrad-${interval.param})`}
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="uniformity"
                      stroke="#22c55e"
                      fill={`url(#unifGrad-${interval.param})`}
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <ReferenceLine
                      x={currentVal}
                      stroke={TWIST_LEVEL_COLORS[currentPoint?.twistLevel || 'optimal']}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-4 mt-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-500 rounded inline-block" />
                  <span className="text-slate-400">断线风险</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" />
                  <span className="text-slate-400">均匀度</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-3 h-0.5 rounded inline-block"
                    style={{ backgroundColor: TWIST_LEVEL_COLORS[currentPoint?.twistLevel || 'optimal'], borderStyle: 'dashed' }}
                  />
                  <span className="text-slate-400">当前位置 ({TWIST_LEVEL_LABELS[currentPoint?.twistLevel || 'optimal']})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
