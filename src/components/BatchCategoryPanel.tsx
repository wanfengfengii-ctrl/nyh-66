import { useMemo, useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { BATCH_CATEGORY_LABELS, BATCH_CATEGORY_COLORS, QUALITY_GRADE_COLORS } from '@/utils/constants';
import type { BatchCategory, CategorizedBatch } from '@/types';
import { Layers, Shield, AlertTriangle, AlertOctagon, Activity, ChevronRight, Trash2, Calendar } from 'lucide-react';

const CATEGORY_ICONS: Record<BatchCategory, typeof Shield> = {
  premium: Shield,
  normal: Activity,
  risk: AlertTriangle,
  reject: AlertOctagon,
};

export default function BatchCategoryPanel() {
  const {
    batches,
    activeBatchId,
    setActiveBatch,
    deleteBatch,
    getCategorizedBatches,
  } = useYarnStore();

  const categorizedBatches = useMemo(() => getCategorizedBatches(), [batches, getCategorizedBatches]);
  const [activeCategory, setActiveCategory] = useState<BatchCategory | 'all'>('all');

  const groupedBatches = useMemo(() => {
    const groups: Record<BatchCategory | 'all', CategorizedBatch[]> = {
      all: categorizedBatches,
      premium: [],
      normal: [],
      risk: [],
      reject: [],
    };
    categorizedBatches.forEach((cb) => {
      groups[cb.category].push(cb);
    });
    return groups;
  }, [categorizedBatches]);

  const categoryStats = useMemo(() => ({
    premium: groupedBatches.premium.length,
    normal: groupedBatches.normal.length,
    risk: groupedBatches.risk.length,
    reject: groupedBatches.reject.length,
  }), [groupedBatches]);

  const displayBatches = activeCategory === 'all'
    ? categorizedBatches
    : groupedBatches[activeCategory];

  if (batches.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Layers className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">暂无批次数据，请先创建批次并添加样本</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-fuchsia-500 rounded-full"></span>
        <Layers className="w-5 h-5 text-fuchsia-400" />
        批次分类总览
        <span className="ml-2 text-sm font-normal text-slate-400">
          共 {batches.length} 个批次
        </span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`p-3 rounded-xl border transition-all ${
            activeCategory === 'all'
              ? 'bg-slate-700/60 border-slate-500'
              : 'bg-slate-950/40 border-slate-700/40 hover:border-slate-600/50'
          }`}
        >
          <div className="text-xl font-bold text-white">{batches.length}</div>
          <div className="text-[10px] text-slate-400">全部批次</div>
        </button>
        {(['premium', 'normal', 'risk', 'reject'] as BatchCategory[]).map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const count = categoryStats[cat];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`p-3 rounded-xl border transition-all text-left ${
                activeCategory === cat
                  ? 'border-opacity-80'
                  : 'hover:border-opacity-60'
              }`}
              style={{
                backgroundColor: activeCategory === cat ? `${BATCH_CATEGORY_COLORS[cat]}20` : 'rgba(2,6,23,0.3)',
                borderColor: activeCategory === cat ? BATCH_CATEGORY_COLORS[cat] : `${BATCH_CATEGORY_COLORS[cat]}30`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl font-bold" style={{ color: BATCH_CATEGORY_COLORS[cat] }}>
                  {count}
                </span>
                <Icon className="w-3.5 h-3.5" style={{ color: BATCH_CATEGORY_COLORS[cat], opacity: 0.7 }} />
              </div>
              <div className="text-[10px]" style={{ color: `${BATCH_CATEGORY_COLORS[cat]}cc` }}>
                {BATCH_CATEGORY_LABELS[cat]}
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
        {displayBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <p className="text-sm">该分类下暂无批次</p>
          </div>
        ) : (
          displayBatches.map(({ batch, summary, category }) => {
            const Icon = CATEGORY_ICONS[category];
            const isActive = batch.id === activeBatchId;
            return (
              <div
                key={batch.id}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-700/40 border-slate-500/60'
                    : 'bg-slate-950/40 border-slate-700/50 hover:border-slate-600/50'
                }`}
                onClick={() => setActiveBatch(batch.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${BATCH_CATEGORY_COLORS[category]}20`,
                      }}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: BATCH_CATEGORY_COLORS[category] }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-1.5">
                        {batch.name}
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400">当前</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(batch.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${BATCH_CATEGORY_COLORS[category]}20`,
                        color: BATCH_CATEGORY_COLORS[category],
                      }}
                    >
                      {BATCH_CATEGORY_LABELS[category]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBatch(batch.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div className="bg-slate-900/60 rounded-lg p-1.5 text-center">
                    <div className="text-slate-500">样本数</div>
                    <div className="text-white font-medium tabular-nums">{summary.totalSamples}</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-1.5 text-center">
                    <div className="text-slate-500">稳定性</div>
                    <div
                      className="font-medium tabular-nums"
                      style={{
                        color: summary.stabilityScore >= 70 ? '#10b981' :
                               summary.stabilityScore >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {summary.stabilityScore}分
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-1.5 text-center">
                    <div className="text-slate-500">通过率</div>
                    <div
                      className="font-medium tabular-nums"
                      style={{
                        color: summary.passRate >= 0.8 ? '#10b981' :
                               summary.passRate >= 0.6 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {(summary.passRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-1.5 text-center">
                    <div className="text-slate-500">平均分</div>
                    <div
                      className="font-medium tabular-nums"
                      style={{
                        color: QUALITY_GRADE_COLORS[
                          summary.avgQualityScore >= 90 ? 'S' :
                          summary.avgQualityScore >= 75 ? 'A' :
                          summary.avgQualityScore >= 60 ? 'B' :
                          summary.avgQualityScore >= 40 ? 'C' : 'D'
                        ],
                      }}
                    >
                      {summary.avgQualityScore}分
                    </div>
                  </div>
                </div>

                {summary.isAnomalous && summary.anomalyReasons.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/40">
                    <div className="flex flex-wrap gap-1">
                      {summary.anomalyReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400/90"
                        >
                          ⚠ {reason.length > 20 ? reason.slice(0, 20) + '...' : reason}
                        </span>
                      ))}
                      {summary.anomalyReasons.length > 2 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                          +{summary.anomalyReasons.length - 2}项异常
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
