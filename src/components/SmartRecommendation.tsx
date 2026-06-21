import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import type { RecommendTarget } from '@/types';
import { Lightbulb, Target, Shield, ArrowRight } from 'lucide-react';

export default function SmartRecommendation() {
  const {
    params,
    recommendTarget,
    targetTwist,
    targetBreakRisk,
    targetUniformity,
    setRecommendTarget,
    setTargetTwist,
    setTargetBreakRisk,
    setTargetUniformity,
    getRecommendations,
    applyRecommendation,
  } = useYarnStore();

  const recommendations = useMemo(() => getRecommendations(), [
    params, recommendTarget, targetTwist, targetBreakRisk, targetUniformity,
  ]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-5 bg-amber-400 rounded-full"></span>
        智能参数推荐
      </h2>

      <div className="flex bg-slate-700/50 rounded-lg p-0.5 mb-4">
        <button
          onClick={() => setRecommendTarget('twist')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            recommendTarget === 'twist'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target size={14} />
          目标捻度
        </button>
        <button
          onClick={() => setRecommendTarget('stability')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            recommendTarget === 'stability'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield size={14} />
          目标稳定性
        </button>
      </div>

      {recommendTarget === 'twist' ? (
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-2">目标捻度 (捻/m)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={1200}
              step={10}
              value={targetTwist}
              onChange={(e) => setTargetTwist(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold text-lg tabular-nums w-20 text-right">
              {targetTwist}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>50</span>
            <span className="text-sky-400">低捻 &lt;300</span>
            <span className="text-emerald-400">适中 300~800</span>
            <span className="text-amber-400">过捻 &gt;800</span>
            <span>1200</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-2">最大断线风险 (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={70}
                step={5}
                value={targetBreakRisk}
                onChange={(e) => setTargetBreakRisk(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold text-lg tabular-nums w-14 text-right">
                {targetBreakRisk}%
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">最低均匀度 (分)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={40}
                max={95}
                step={5}
                value={targetUniformity}
                onChange={(e) => setTargetUniformity(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold text-lg tabular-nums w-14 text-right">
                {targetUniformity}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {recommendations.length === 0 ? (
          <div className="text-center py-4">
            <Lightbulb size={28} className="mx-auto mb-2 text-slate-500 opacity-50" />
            <p className="text-slate-500 text-xs">当前目标无可行推荐方案</p>
            <p className="text-slate-600 text-xs mt-1">请调整目标值或纤维长度后重试</p>
          </div>
        ) : (
          recommendations.map((rec, i) => {
            const color = TWIST_LEVEL_COLORS[rec.metrics.twistLevel];
            const label = TWIST_LEVEL_LABELS[rec.metrics.twistLevel];
            return (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50 transition-all cursor-pointer group"
                onClick={() => applyRecommendation(rec)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${color}25`, color }}
                    >
                      {label}
                    </span>
                    {rec.targetMet && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        达标
                      </span>
                    )}
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-500 group-hover:text-amber-400 transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-300 mb-2">{rec.description}</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>
                    捻度: <span className="text-white font-medium">{rec.metrics.twist.toFixed(1)}</span>
                  </span>
                  <span>
                    风险: <span className={rec.metrics.breakRisk > 60 ? 'text-red-400' : 'text-white'}>{rec.metrics.breakRisk}%</span>
                  </span>
                  <span>
                    均匀度: <span className="text-white">{rec.metrics.uniformity}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
