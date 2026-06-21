import { useYarnStore } from '@/store/useStore';
import { PARAM_RANGES } from '@/utils/constants';
import { Gauge, Wind, Ruler } from 'lucide-react';

const icons = {
  spindleSpeed: Gauge,
  draftSpeed: Wind,
  fiberLength: Ruler,
};

const colorMap: Record<string, string> = {
  spindleSpeed: 'from-teal-500 to-cyan-600',
  draftSpeed: 'from-sky-500 to-blue-600',
  fiberLength: 'from-amber-500 to-orange-600',
};

export default function ControlPanel() {
  const { params, setParams } = useYarnStore();

  const handleChange = (key: keyof typeof params, value: number) => {
    const range = PARAM_RANGES[key];
    const clamped = Math.max(range.min, Math.min(range.max, value));
    setParams({ [key]: clamped });
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
        工艺参数控制
      </h2>

      <div className="space-y-6">
        {(Object.keys(PARAM_RANGES) as Array<keyof typeof params>).map((key) => {
          const range = PARAM_RANGES[key];
          const Icon = icons[key];
          const value = params[key];
          const percent = ((value - range.min) / (range.max - range.min)) * 100;

          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${colorMap[key]} text-white`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">{range.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {value.toFixed(range.step < 1 ? 1 : 0)}
                  </span>
                  <span className="text-slate-400 text-sm">{range.unit}</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colorMap[key]} rounded-full transition-all duration-150`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={value}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>{range.min} {range.unit}</span>
                <span>{range.max} {range.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
