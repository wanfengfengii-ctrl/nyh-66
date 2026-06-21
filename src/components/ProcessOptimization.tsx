import { useMemo, useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import type { OptimizedScheme, OptimizationSortKey } from '@/types';
import {
  Target,
  Shield,
  Sparkles,
  Zap,
  ArrowRight,
  GitCompareArrows,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Flame,
  TrendingUp,
  BadgeDollarSign,
} from 'lucide-react';

export default function ProcessOptimization() {
  const {
    optimizationTargets,
    optimizationSchemes,
    optimizationSortKey,
    optimizationRecords,
    setOptimizationTargets,
    generateSchemes,
    setOptimizationSortKey,
    getSortedSchemes,
    applyOptimizedScheme,
    addSchemeToCompare,
    saveOptimizationRecord,
    deleteOptimizationRecord,
  } = useYarnStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const sortedSchemes = useMemo(() => getSortedSchemes(), [
    getSortedSchemes,
  ]);

  const handleGenerate = () => {
    generateSchemes();
  };

  const handleSaveRecord = (scheme: OptimizedScheme) => {
    saveOptimizationRecord(scheme, saveName);
    setSaveName('');
    setSavingId(null);
  };

  const sortOptions: { key: OptimizationSortKey; label: string; icon: typeof TrendingUp }[] = [
    { key: 'stability', label: '稳定性', icon: Shield },
    { key: 'compliance', label: '达标率', icon: Target },
    { key: 'cost', label: '工艺成本', icon: BadgeDollarSign },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-5 bg-orange-400 rounded-full"></span>
        多目标工艺优化
      </h2>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Target size={12} />
            目标捻度 (捻/m)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={1200}
              step={10}
              value={optimizationTargets.targetTwist}
              onChange={(e) => setOptimizationTargets({ targetTwist: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-white font-bold text-lg tabular-nums w-20 text-right">
              {optimizationTargets.targetTwist}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Shield size={12} />
            最大断线风险 (%)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={70}
              step={5}
              value={optimizationTargets.maxBreakRisk}
              onChange={(e) => setOptimizationTargets({ maxBreakRisk: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-white font-bold text-lg tabular-nums w-14 text-right">
              {optimizationTargets.maxBreakRisk}%
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles size={12} />
            最低均匀度 (分)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={40}
              max={95}
              step={5}
              value={optimizationTargets.minUniformity}
              onChange={(e) => setOptimizationTargets({ minUniformity: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-white font-bold text-lg tabular-nums w-14 text-right">
              {optimizationTargets.minUniformity}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
      >
        <Zap size={16} />
        生成优化方案
      </button>

      {optimizationSchemes.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              找到 <span className="text-orange-400 font-medium">{optimizationSchemes.length}</span> 组可行方案
            </span>
            <div className="flex bg-slate-700/50 rounded-lg p-0.5">
              {sortOptions.map(({ key, label, icon: SortIcon }) => (
                <button
                  key={key}
                  onClick={() => setOptimizationSortKey(key)}
                  className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                    optimizationSortKey === key
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SortIcon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {sortedSchemes.map((scheme, idx) => {
              const isExpanded = expandedId === scheme.id;
              const color = TWIST_LEVEL_COLORS[scheme.metrics.twistLevel];
              const label = TWIST_LEVEL_LABELS[scheme.metrics.twistLevel];

              return (
                <div
                  key={scheme.id}
                  className="rounded-xl border border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50 transition-all overflow-hidden"
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono w-5">#{idx + 1}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-slate-300 truncate max-w-[120px]">
                          {scheme.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={14} className="text-slate-400" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 flex items-center justify-center gap-0.5">
                          <Shield size={10} />
                          稳定性
                        </div>
                        <div className={`text-sm font-bold tabular-nums ${getScoreColor(scheme.stabilityScore)}`}>
                          {scheme.stabilityScore}
                        </div>
                        <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreBg(scheme.stabilityScore)}`}
                            style={{ width: `${scheme.stabilityScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 flex items-center justify-center gap-0.5">
                          <Target size={10} />
                          达标率
                        </div>
                        <div className={`text-sm font-bold tabular-nums ${getScoreColor(scheme.complianceScore)}`}>
                          {scheme.complianceScore}
                        </div>
                        <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreBg(scheme.complianceScore)}`}
                            style={{ width: `${scheme.complianceScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 flex items-center justify-center gap-0.5">
                          <BadgeDollarSign size={10} />
                          成本
                        </div>
                        <div className={`text-sm font-bold tabular-nums ${getScoreColor(scheme.costScore)}`}>
                          {scheme.costScore}
                        </div>
                        <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreBg(scheme.costScore)}`}
                            style={{ width: `${scheme.costScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-slate-700/50 pt-3">
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-slate-500">转速</div>
                          <div className="text-white font-medium">{scheme.params.spindleSpeed} rpm</div>
                        </div>
                        <div className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-slate-500">牵伸</div>
                          <div className="text-white font-medium">{scheme.params.draftSpeed} m/min</div>
                        </div>
                        <div className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-slate-500">纤维</div>
                          <div className="text-white font-medium">{scheme.params.fiberLength} mm</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-slate-500">捻度</div>
                          <div className="font-medium" style={{ color }}>
                            {scheme.metrics.twist.toFixed(1)} 捻/m
                          </div>
                        </div>
                        <div className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-slate-500">断线风险</div>
                          <div className={`font-medium ${scheme.metrics.breakRisk > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {scheme.metrics.breakRisk}%
                          </div>
                        </div>
                        <div className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-slate-500">均匀度</div>
                          <div className={`font-medium ${scheme.metrics.uniformity >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {scheme.metrics.uniformity} 分
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            applyOptimizedScheme(scheme);
                          }}
                          className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                        >
                          <ArrowRight size={12} />
                          应用
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addSchemeToCompare(scheme);
                          }}
                          className="flex-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                        >
                          <GitCompareArrows size={12} />
                          加入对比
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavingId(scheme.id);
                          }}
                          className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                        >
                          <Bookmark size={12} />
                          保存记录
                        </button>
                      </div>

                      {savingId === scheme.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="输入记录名称..."
                            className="flex-1 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRecord(scheme);
                            }}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium"
                          >
                            确认
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {optimizationRecords.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
            <Bookmark size={14} className="text-purple-400" />
            实验记录
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {optimizationRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white font-medium truncate">{record.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(record.createdAt)} · 达标率 {record.scheme.complianceScore}
                  </div>
                </div>
                <button
                  onClick={() => deleteOptimizationRecord(record.id)}
                  className="p-1 text-slate-500 hover:text-red-400 rounded transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <Flame size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
