import { useMemo, useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { QUALITY_GRADE_LABELS, QUALITY_GRADE_COLORS, QUALITY_GRADE_BG, PRODUCTION_ADVICE_LABELS, PRODUCTION_ADVICE_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { assessBatch, generateBatchRecommendations } from '@/utils/calculations';
import type { BatchSample, QualityGrade, ProductionAdvice } from '@/types';
import { Award, AlertCircle, CheckCircle2, Trash2, BarChart3, Filter, Gauge, ShieldAlert } from 'lucide-react';

const GRADE_ORDER: QualityGrade[] = ['S', 'A', 'B', 'C', 'D'];
const ADVICE_ORDER: ProductionAdvice[] = ['pass', 'adjust', 'warning', 'reject'];

type FilterType = 'all' | QualityGrade | ProductionAdvice;

export default function BatchSampleList() {
  const {
    activeBatchId,
    getActiveBatch,
    removeSampleFromBatch,
    clearBatchSamples,
    setParams,
  } = useYarnStore();

  const activeBatch = getActiveBatch();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showGradeFilter, setShowGradeFilter] = useState(false);
  const [showAdviceFilter, setShowAdviceFilter] = useState(false);

  const assessment = useMemo(() => {
    if (!activeBatch) return null;
    return assessBatch(activeBatch);
  }, [activeBatch]);

  const filteredSamples = useMemo(() => {
    if (!activeBatch) return [];
    let samples = activeBatch.samples;
    if (filter !== 'all') {
      if (GRADE_ORDER.includes(filter as QualityGrade)) {
        samples = samples.filter((s) => s.qualityGrade === filter);
      } else if (ADVICE_ORDER.includes(filter as ProductionAdvice)) {
        samples = samples.filter((s) => s.productionAdvice === filter);
      }
    }
    return samples;
  }, [activeBatch, filter]);

  const handleApplySample = (sample: BatchSample) => {
    setParams(sample.params);
  };

  if (!activeBatch) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">请先选择或创建一个批次</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
          <Award className="w-5 h-5 text-teal-400" />
          样本质量评估
          <span className="ml-2 text-sm font-normal text-slate-400">
            「{activeBatch.name}」共 {activeBatch.samples.length} 个样本
          </span>
        </h2>
        {activeBatch.samples.length > 0 && (
          <button
            onClick={() => clearBatchSamples(activeBatch.id)}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空样本
          </button>
        )}
      </div>

      {assessment && activeBatch.samples.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              批次稳定性
            </div>
            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
              {assessment.summary.stabilityScore}
              <span className="text-xs text-slate-500 font-normal">分</span>
            </div>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              通过率
            </div>
            <div className="text-2xl font-bold text-emerald-400 flex items-baseline gap-1">
              {(assessment.summary.passRate * 100).toFixed(0)}
              <span className="text-xs text-slate-500 font-normal">%</span>
            </div>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              平均质量
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: QUALITY_GRADE_COLORS[
              assessment.summary.avgQualityScore >= 90 ? 'S' :
              assessment.summary.avgQualityScore >= 75 ? 'A' :
              assessment.summary.avgQualityScore >= 60 ? 'B' :
              assessment.summary.avgQualityScore >= 40 ? 'C' : 'D'
            ] }}>
              {assessment.summary.avgQualityScore}
              <span className="text-xs text-slate-500 font-normal">分</span>
            </div>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              {assessment.summary.isAnomalous ? <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {assessment.summary.isAnomalous ? '存在异常' : '状态正常'}
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1">
              <span className={assessment.summary.isAnomalous ? 'text-amber-400' : 'text-emerald-400'}>
                {assessment.anomalies.length}
              </span>
              <span className="text-xs text-slate-500 font-normal">项</span>
            </div>
          </div>
        </div>
      )}

      {assessment && assessment.recommendations.length > 0 && (
        <div className="mb-4 p-3 bg-teal-950/30 rounded-xl border border-teal-800/30">
          <div className="text-xs font-medium text-teal-400 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            生产建议
          </div>
          <ul className="space-y-1">
            {assessment.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-xs text-teal-200/90 flex items-start gap-1.5">
                <span className="text-teal-500 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeBatch.samples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            筛选：
          </span>
          <button
            onClick={() => { setFilter('all'); setShowGradeFilter(false); setShowAdviceFilter(false); }}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            全部
          </button>
          <div className="relative">
            <button
              onClick={() => { setShowGradeFilter(!showGradeFilter); setShowAdviceFilter(false); }}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                GRADE_ORDER.includes(filter as QualityGrade)
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              按等级
              {showGradeFilter ? '▲' : '▼'}
            </button>
            {showGradeFilter && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-1 z-10 shadow-lg">
                {GRADE_ORDER.map((g) => (
                  <button
                    key={g}
                    onClick={() => { setFilter(g); setShowGradeFilter(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded hover:bg-slate-700 transition-colors"
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: QUALITY_GRADE_BG[g], color: QUALITY_GRADE_COLORS[g] }}
                    >
                      {g}
                    </span>
                    <span className="text-slate-300">{QUALITY_GRADE_LABELS[g]}</span>
                    <span className="text-slate-500 ml-auto">
                      {activeBatch.samples.filter((s) => s.qualityGrade === g).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => { setShowAdviceFilter(!showAdviceFilter); setShowGradeFilter(false); }}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                ADVICE_ORDER.includes(filter as ProductionAdvice)
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              按建议
              {showAdviceFilter ? '▲' : '▼'}
            </button>
            {showAdviceFilter && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-1 z-10 shadow-lg">
                {ADVICE_ORDER.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setFilter(a); setShowAdviceFilter(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded hover:bg-slate-700 transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PRODUCTION_ADVICE_COLORS[a] }}
                    />
                    <span className="text-slate-300">{PRODUCTION_ADVICE_LABELS[a]}</span>
                    <span className="text-slate-500 ml-auto">
                      {activeBatch.samples.filter((s) => s.productionAdvice === a).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 ml-auto">
            显示 {filteredSamples.length}/{activeBatch.samples.length}
          </span>
        </div>
      )}

      {filteredSamples.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">
            {activeBatch.samples.length === 0 ? '暂无样本，请先添加参数到批次' : '没有符合筛选条件的样本'}
          </p>
        </div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2">
          {filteredSamples.map((sample, idx) => (
            <div
              key={sample.id}
              className="p-3 rounded-xl border border-slate-700/50 bg-slate-950/40 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                    style={{
                      backgroundColor: QUALITY_GRADE_BG[sample.qualityGrade],
                      color: QUALITY_GRADE_COLORS[sample.qualityGrade],
                      boxShadow: `0 0 12px ${QUALITY_GRADE_COLORS[sample.qualityGrade]}30`,
                    }}
                  >
                    {sample.qualityGrade}
                  </span>
                  <div>
                    <div className="text-xs text-slate-400">样本 #{idx + 1}</div>
                    <div className="text-sm font-medium text-white">
                      {QUALITY_GRADE_LABELS[sample.qualityGrade]} · {sample.qualityScore}分
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${PRODUCTION_ADVICE_COLORS[sample.productionAdvice]}20`,
                      color: PRODUCTION_ADVICE_COLORS[sample.productionAdvice],
                    }}
                  >
                    {PRODUCTION_ADVICE_LABELS[sample.productionAdvice]}
                  </span>
                  <button
                    onClick={() => handleApplySample(sample)}
                    className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                    title="应用此参数"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeSampleFromBatch(activeBatch.id, sample.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="删除样本"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2 text-xs">
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500 text-[10px]">转速</div>
                  <div className="text-white font-medium tabular-nums">{sample.params.spindleSpeed} rpm</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500 text-[10px]">牵伸</div>
                  <div className="text-white font-medium tabular-nums">{sample.params.draftSpeed} m/min</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500 text-[10px]">纤维</div>
                  <div className="text-white font-medium tabular-nums">{sample.params.fiberLength} mm</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500 text-[10px]">捻度</div>
                  <div className="text-sky-400 font-medium tabular-nums">{sample.metrics.twist.toFixed(0)}</div>
                  <div className="text-[9px] text-slate-500">{TWIST_LEVEL_LABELS[sample.metrics.twistLevel]}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500 text-[10px]">风险</div>
                  <div className={`font-medium tabular-nums ${
                    sample.metrics.breakRisk >= 70 ? 'text-red-400' :
                    sample.metrics.breakRisk >= 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {sample.metrics.breakRisk}%
                  </div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500 text-[10px]">均匀度</div>
                  <div className={`font-medium tabular-nums ${
                    sample.metrics.uniformity >= 70 ? 'text-emerald-400' :
                    sample.metrics.uniformity >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {sample.metrics.uniformity}分
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
