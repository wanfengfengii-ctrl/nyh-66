import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import { TWIST_THRESHOLDS, TWIST_LEVEL_COLORS } from '@/utils/constants';

export default function StatusIndicator() {
  const { params } = useYarnStore();
  const metrics = useMemo(() => calculateYarnMetrics(params), [params]);

  const minTwist = 0;
  const maxTwist = 1200;

  const position = Math.min(100, Math.max(0, ((metrics.twist - minTwist) / (maxTwist - minTwist)) * 100));

  const lowEnd = (TWIST_THRESHOLDS.lowMax / maxTwist) * 100;
  const optimalEnd = (TWIST_THRESHOLDS.optimalMax / maxTwist) * 100;

  const labels = [
    { label: '低捻', pos: lowEnd / 2, color: 'text-sky-400' },
    { label: '适中', pos: (lowEnd + optimalEnd) / 2, color: 'text-emerald-400' },
    { label: '过捻', pos: (optimalEnd + 100) / 2, color: 'text-amber-400' },
  ];

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
        捻度状态
      </h3>

      <div className="relative mb-4">
        <div className="h-4 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-sky-600 to-sky-500"
            style={{ width: `${lowEnd}%` }}
          />
          <div
            className="bg-gradient-to-r from-emerald-500 to-green-500"
            style={{ width: `${optimalEnd - lowEnd}%` }}
          />
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-600"
            style={{ width: `${100 - optimalEnd}%` }}
          />
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ left: `${position}%` }}
        >
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: TWIST_LEVEL_COLORS[metrics.twistLevel] }}
          />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
        </div>
      </div>

      <div className="flex justify-between text-xs">
        {labels.map((item) => (
          <span key={item.label} className={item.color}>
            {item.label}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">可行性</span>
          {metrics.isFeasible ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              稳定方案
            </span>
          ) : (
            <span className="text-red-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              不可行
            </span>
          )}
        </div>
        {!metrics.isFeasible && (
          <p className="text-xs text-slate-500 mt-2">
            当前参数组合断线风险过高或均匀度不足，不建议作为生产方案
          </p>
        )}
      </div>
    </div>
  );
}
