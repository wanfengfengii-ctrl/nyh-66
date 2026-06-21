import { useEffect, useMemo, useState, useCallback } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics, detectSchemeAnomalies } from '@/utils/calculations';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS, BREAK_RISK_THRESHOLD } from '@/utils/constants';
import type { OptimizedScheme, OptimizationSortKey, AlertType, AlertLevel, AlertItem } from '@/types';
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
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ShieldAlert,
  Activity,
  TrendingDown,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  Play,
  Eye,
  Radio,
  ToggleLeft,
  ToggleRight,
  BarChart3,
} from 'lucide-react';

type TabKey = 'optimize' | 'alert';

const sortOptions: { key: OptimizationSortKey; label: string; icon: typeof TrendingUp }[] = [
  { key: 'stability', label: '稳定性', icon: Shield },
  { key: 'compliance', label: '达标率', icon: Target },
  { key: 'cost', label: '工艺成本', icon: BadgeDollarSign },
];

const typeIcons: Record<AlertType, typeof AlertTriangle> = {
  high_risk: ShieldAlert,
  fluctuation: Activity,
  out_of_range: TrendingDown,
};

const typeLabels: Record<AlertType, string> = {
  high_risk: '高风险组合',
  fluctuation: '波动异常',
  out_of_range: '超出稳定区间',
};

const levelStyles: Record<AlertLevel, { bg: string; border: string; text: string; icon: string; dot: string }> = {
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400',
    dot: 'bg-red-400',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  low: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    icon: 'text-sky-400',
    dot: 'bg-sky-400',
  },
};

const levelLabels: Record<AlertLevel, string> = {
  high: '严重',
  medium: '警告',
  low: '提示',
};

export default function OptimizationDecisionPanel() {
  const {
    params,
    playback,
    optimizationTargets,
    optimizationSchemes,
    optimizationSortKey,
    optimizationRecords,
    alerts,
    autoGenerate,
    realtimeMonitor,
    selectedSchemeIds,
    setOptimizationTargets,
    generateSchemes,
    setOptimizationSortKey,
    getSortedSchemes,
    applyOptimizedScheme,
    addSchemeToCompare,
    saveOptimizationRecord,
    deleteOptimizationRecord,
    refreshAlerts,
    dismissAlert,
    clearAlerts,
    setAutoGenerate,
    setRealtimeMonitor,
    toggleSchemeSelection,
    clearSchemeSelection,
    addSelectedSchemesToCompare,
    getSchemeRiskLevel,
  } = useYarnStore();

  const [activeTab, setActiveTab] = useState<TabKey>('optimize');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const metrics = useMemo(() => calculateYarnMetrics(params), [params]);
  const sortedSchemes = useMemo(() => getSortedSchemes(), [getSortedSchemes]);

  useEffect(() => {
    if (autoGenerate && optimizationSchemes.length === 0) {
      generateSchemes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!realtimeMonitor) return;
    const interval = setInterval(() => {
      refreshAlerts();
    }, 3000);
    return () => clearInterval(interval);
  }, [realtimeMonitor, refreshAlerts]);

  useEffect(() => {
    if (realtimeMonitor) {
      refreshAlerts();
    }
  }, [params, playback.keyframes.length, metrics.breakRisk, metrics.uniformity, metrics.isFeasible, realtimeMonitor]); // eslint-disable-line react-hooks/exhaustive-deps

  const schemeAlerts = useMemo(() => detectSchemeAnomalies(optimizationSchemes), [optimizationSchemes]);
  const allAlerts = useMemo(() => {
    const active = alerts.filter((a) => !a.dismissed);
    const schemeActive = schemeAlerts.filter((a) => !active.some((ea) => ea.message === a.message));
    return [...active, ...schemeActive];
  }, [alerts, schemeAlerts]);

  const activeAlerts = allAlerts;
  const highCount = activeAlerts.filter((a) => a.level === 'high').length;
  const mediumCount = activeAlerts.filter((a) => a.level === 'medium').length;
  const lowCount = activeAlerts.filter((a) => a.level === 'low').length;

  const groupedAlerts = useMemo(() => {
    const groups: Record<AlertType, AlertItem[]> = {
      high_risk: [],
      fluctuation: [],
      out_of_range: [],
    };
    activeAlerts.forEach((alert) => {
      groups[alert.type].push(alert);
    });
    return groups;
  }, [activeAlerts]);

  const handleGenerate = useCallback(() => {
    generateSchemes();
  }, [generateSchemes]);

  const handleSaveRecord = useCallback((scheme: OptimizedScheme) => {
    saveOptimizationRecord(scheme, saveName);
    setSaveName('');
    setSavingId(null);
  }, [saveName, saveOptimizationRecord]);

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

  const getRiskBadge = (scheme: OptimizedScheme) => {
    const level = getSchemeRiskLevel(scheme);
    if (level === 'high') return { text: '高风险', cls: 'bg-red-500/20 text-red-400' };
    if (level === 'medium') return { text: '中风险', cls: 'bg-amber-500/20 text-amber-400' };
    return { text: '低风险', cls: 'bg-emerald-500/20 text-emerald-400' };
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-5 bg-orange-400 rounded-full"></span>
            多目标工艺优化与预警决策
          </h2>
          {activeAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium flex items-center gap-1 animate-pulse">
              <AlertTriangle size={10} />
              {activeAlerts.length} 预警
            </span>
          )}
        </div>

        <div className="flex bg-slate-700/50 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('optimize')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'optimize'
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            优化方案
            {optimizationSchemes.length > 0 && (
              <span className={`ml-0.5 px-1.5 py-0 rounded-full text-xs ${
                activeTab === 'optimize' ? 'bg-orange-500/30 text-orange-200' : 'bg-slate-600 text-slate-300'
              }`}>
                {optimizationSchemes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('alert')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'alert'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert size={14} />
            预警面板
            {activeAlerts.length > 0 && (
              <span className={`ml-0.5 px-1.5 py-0 rounded-full text-xs ${
                activeTab === 'alert' ? 'bg-red-500/30 text-red-200' : 'bg-slate-600 text-slate-300'
              }`}>
                {activeAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'optimize' && (
        <div className="p-5 pt-4">
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
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>50</span>
                <span className="text-sky-400">低捻 &lt;300</span>
                <span className="text-emerald-400">适中 300~800</span>
                <span className="text-amber-400">过捻 &gt;800</span>
                <span>1200</span>
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

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setAutoGenerate(!autoGenerate)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all"
            >
              {autoGenerate ? (
                <ToggleRight size={18} className="text-orange-400" />
              ) : (
                <ToggleLeft size={18} />
              )}
              自动生成
            </button>
            <button
              onClick={() => setRealtimeMonitor(!realtimeMonitor)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all"
            >
              {realtimeMonitor ? (
                <Radio size={14} className="text-red-400 animate-pulse" />
              ) : (
                <Radio size={14} />
              )}
              实时监控
            </button>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
          >
            <Zap size={16} />
            {autoGenerate ? '重新搜索方案' : '生成优化方案'}
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

              {selectedSchemeIds.length > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                  <span className="text-xs text-teal-400 font-medium">
                    已选 {selectedSchemeIds.length} 组方案
                  </span>
                  <button
                    onClick={addSelectedSchemesToCompare}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <GitCompareArrows size={11} />
                    一键加入对比
                  </button>
                  <button
                    onClick={clearSchemeSelection}
                    className="px-2 py-1 text-slate-400 hover:text-white text-xs transition-all"
                  >
                    取消
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sortedSchemes.map((scheme, idx) => {
                  const isExpanded = expandedId === scheme.id;
                  const color = TWIST_LEVEL_COLORS[scheme.metrics.twistLevel];
                  const label = TWIST_LEVEL_LABELS[scheme.metrics.twistLevel];
                  const riskBadge = getRiskBadge(scheme);
                  const isSelected = selectedSchemeIds.includes(scheme.id);

                  return (
                    <div
                      key={scheme.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isSelected
                          ? 'border-teal-500/50 bg-teal-500/5'
                          : 'border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSchemeSelection(scheme.id);
                              }}
                              className="shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare size={14} className="text-teal-400" />
                              ) : (
                                <Square size={14} className="text-slate-500 hover:text-slate-300" />
                              )}
                            </button>
                            <span className="text-xs text-slate-500 font-mono w-5">#{idx + 1}</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                              style={{ backgroundColor: `${color}25`, color }}
                            >
                              {label}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${riskBadge.cls}`}>
                              {riskBadge.text}
                            </span>
                            <span className="text-xs text-slate-300 truncate">
                              {scheme.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
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

          {optimizationSchemes.length === 0 && (
            <div className="mt-5 text-center py-6">
              <BarChart3 size={32} className="mx-auto mb-2 text-slate-500 opacity-40" />
              <p className="text-sm text-slate-500">设置目标后生成优化方案</p>
              <p className="text-xs text-slate-600 mt-1">调整三项指标后点击生成或开启自动生成</p>
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
                        {formatDate(record.createdAt)} · 达标率 {record.scheme.complianceScore} · 稳定性 {record.scheme.stabilityScore}
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
      )}

      {activeTab === 'alert' && (
        <div className="p-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {realtimeMonitor && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs text-red-400 font-medium">实时监控中</span>
                </div>
              )}
              <div className="flex gap-3">
                {highCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-red-400 font-medium">{highCount} 严重</span>
                  </div>
                )}
                {mediumCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-amber-400 font-medium">{mediumCount} 警告</span>
                  </div>
                )}
                {lowCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="text-sky-400 font-medium">{lowCount} 提示</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRealtimeMonitor(!realtimeMonitor)}
                className={`p-1.5 rounded-lg transition-all ${
                  realtimeMonitor ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={realtimeMonitor ? '暂停实时监控' : '开启实时监控'}
              >
                <Radio size={14} />
              </button>
              <button
                onClick={refreshAlerts}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                title="刷新检测"
              >
                <RefreshCw size={14} />
              </button>
              {activeAlerts.length > 0 && (
                <button
                  onClick={clearAlerts}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="清除全部"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {(Object.keys(groupedAlerts) as AlertType[]).map((type) => {
              const typeAlerts = groupedAlerts[type];
              if (typeAlerts.length === 0) return null;
              const TypeIcon = typeIcons[type];

              return (
                <div key={type}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TypeIcon size={12} className="text-slate-500" />
                    <span className="text-xs font-medium text-slate-400">{typeLabels[type]}</span>
                    <span className="text-xs text-slate-600">({typeAlerts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {typeAlerts.map((alert) => {
                      const styles = levelStyles[alert.level];
                      const LevelIcon = alert.level === 'high' ? AlertTriangle : alert.level === 'medium' ? AlertCircle : Info;

                      return (
                        <div
                          key={alert.id}
                          className={`relative p-3 rounded-xl border ${styles.border} ${styles.bg} transition-all`}
                        >
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="absolute top-2 right-2 p-0.5 text-slate-500 hover:text-white rounded transition-all"
                          >
                            <X size={12} />
                          </button>
                          <div className="flex items-start gap-2 pr-5">
                            <LevelIcon size={14} className={`${styles.icon} mt-0.5 shrink-0`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${styles.text} ${styles.bg}`}>
                                  {levelLabels[alert.level]}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                              {alert.params && alert.metrics && (
                                <div className="mt-1.5 flex gap-2 text-xs text-slate-500">
                                  <span>转速 {alert.params.spindleSpeed}rpm</span>
                                  <span>牵伸 {alert.params.draftSpeed}m/min</span>
                                  <span>风险 {alert.metrics.breakRisk}%</span>
                                  <span>均匀度 {alert.metrics.uniformity}分</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {activeAlerts.length === 0 && (
              <div className="text-center py-8">
                <ShieldAlert size={36} className="mx-auto mb-3 text-emerald-500/40" />
                <p className="text-sm text-slate-500">当前无异常预警</p>
                <p className="text-xs text-slate-600 mt-1">所有工艺参数均在安全范围内</p>
                {realtimeMonitor && (
                  <p className="text-xs text-slate-600 mt-2 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    实时监控持续运行中
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-700/50">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-1.5">
              <Eye size={14} className="text-slate-400" />
              当前状态概览
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2.5 rounded-lg border text-center ${
                metrics.breakRisk >= BREAK_RISK_THRESHOLD
                  ? 'bg-red-500/10 border-red-500/30'
                  : metrics.breakRisk >= BREAK_RISK_THRESHOLD - 20
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="text-xs text-slate-400">断线风险</div>
                <div className={`text-lg font-bold tabular-nums ${
                  metrics.breakRisk >= BREAK_RISK_THRESHOLD ? 'text-red-400' : metrics.breakRisk >= BREAK_RISK_THRESHOLD - 20 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {metrics.breakRisk}%
                </div>
                <div className={`text-xs ${
                  metrics.breakRisk >= BREAK_RISK_THRESHOLD ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {metrics.breakRisk >= BREAK_RISK_THRESHOLD ? '危险' : metrics.breakRisk >= BREAK_RISK_THRESHOLD - 20 ? '注意' : '安全'}
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border text-center ${
                metrics.uniformity < 50
                  ? 'bg-red-500/10 border-red-500/30'
                  : metrics.uniformity < 70
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="text-xs text-slate-400">均匀度</div>
                <div className={`text-lg font-bold tabular-nums ${
                  metrics.uniformity < 50 ? 'text-red-400' : metrics.uniformity < 70 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {metrics.uniformity}
                </div>
                <div className={`text-xs ${
                  metrics.uniformity < 50 ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {metrics.uniformity >= 80 ? '优秀' : metrics.uniformity >= 60 ? '良好' : '一般'}
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border text-center ${
                !metrics.isFeasible
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="text-xs text-slate-400">可行性</div>
                <div className={`text-lg font-bold ${
                  metrics.isFeasible ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {metrics.isFeasible ? '✓' : '✗'}
                </div>
                <div className={`text-xs ${
                  metrics.isFeasible ? 'text-slate-500' : 'text-red-400'
                }`}>
                  {metrics.isFeasible ? '可行' : '不可行'}
                </div>
              </div>
            </div>

            {playback.isRecording && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">录制中 - 操作异常将被实时记录</span>
              </div>
            )}
            {playback.isPlaybackView && (
              <div className="mt-3 p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-2">
                <Play size={12} className="text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">回放模式 - 波动异常实时检测中</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
