import { useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { QUALITY_GRADE_LABELS, QUALITY_GRADE_COLORS, QUALITY_GRADE_BG, PRODUCTION_ADVICE_LABELS, PRODUCTION_ADVICE_COLORS, BATCH_CATEGORY_LABELS, BATCH_CATEGORY_COLORS } from '@/utils/constants';
import { assessBatch } from '@/utils/calculations';
import type { QualityGrade, ProductionAdvice } from '@/types';
import { PieChart, AlertTriangle, TrendingUp, Activity, BarChart2, Shield, AlertOctagon } from 'lucide-react';

export default function BatchSummaryPanel() {
  const {
    activeBatchId,
    getActiveBatch,
    getBatchCategory,
  } = useYarnStore();

  const activeBatch = getActiveBatch();
  const category = activeBatchId ? getBatchCategory(activeBatchId) : null;

  const assessment = useMemo(() => {
    if (!activeBatch) return null;
    return assessBatch(activeBatch);
  }, [activeBatch]);

  if (!activeBatch || !assessment) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <PieChart className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">请先选择一个批次以查看汇总统计</p>
        </div>
      </div>
    );
  }

  const { summary, anomalies, recommendations } = assessment;
  const grades: QualityGrade[] = ['S', 'A', 'B', 'C', 'D'];
  const advices: ProductionAdvice[] = ['pass', 'adjust', 'warning', 'reject'];

  const gradePercentages = grades.map((g) => ({
    grade: g,
    count: summary.gradeDistribution[g],
    pct: summary.totalSamples > 0 ? (summary.gradeDistribution[g] / summary.totalSamples) * 100 : 0,
  }));

  const advicePercentages = advices.map((a) => ({
    advice: a,
    count: summary.adviceDistribution[a],
    pct: summary.totalSamples > 0 ? (summary.adviceDistribution[a] / summary.totalSamples) * 100 : 0,
  }));

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
        <BarChart2 className="w-5 h-5 text-amber-400" />
        批次汇总与异常分析
      </h2>

      {category && (
        <div
          className="mb-4 p-3 rounded-xl border flex items-center gap-3"
          style={{
            backgroundColor: `${BATCH_CATEGORY_COLORS[category]}15`,
            borderColor: `${BATCH_CATEGORY_COLORS[category]}40`,
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${BATCH_CATEGORY_COLORS[category]}30` }}
          >
            {category === 'premium' ? <Shield className="w-5 h-5" style={{ color: BATCH_CATEGORY_COLORS[category] }} /> :
             category === 'normal' ? <Activity className="w-5 h-5" style={{ color: BATCH_CATEGORY_COLORS[category] }} /> :
             category === 'risk' ? <AlertTriangle className="w-5 h-5" style={{ color: BATCH_CATEGORY_COLORS[category] }} /> :
             <AlertOctagon className="w-5 h-5" style={{ color: BATCH_CATEGORY_COLORS[category] }} />}
          </div>
          <div>
            <div className="text-xs text-slate-400">批次分类</div>
            <div className="text-base font-bold" style={{ color: BATCH_CATEGORY_COLORS[category] }}>
              {BATCH_CATEGORY_LABELS[category]}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-slate-400">稳定性评分</div>
            <div className="text-xl font-bold text-white">{summary.stabilityScore}<span className="text-sm font-normal text-slate-500">/100</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            平均捻度
          </div>
          <div className="text-xl font-bold text-white">
            {summary.avgTwist}
            <span className="text-xs text-slate-500 font-normal ml-1">捻/m</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            CV: {(summary.twistCV * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            平均风险
          </div>
          <div className={`text-xl font-bold ${
            summary.avgBreakRisk >= 70 ? 'text-red-400' :
            summary.avgBreakRisk >= 40 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {summary.avgBreakRisk}
            <span className="text-xs text-slate-500 font-normal ml-1">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            CV: {(summary.breakRiskCV * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            平均均匀度
          </div>
          <div className={`text-xl font-bold ${
            summary.avgUniformity >= 70 ? 'text-emerald-400' :
            summary.avgUniformity >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {summary.avgUniformity}
            <span className="text-xs text-slate-500 font-normal ml-1">分</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            CV: {(summary.uniformityCV * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/40">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            通过率
          </div>
          <div className={`text-xl font-bold ${
            summary.passRate >= 0.8 ? 'text-emerald-400' :
            summary.passRate >= 0.6 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {(summary.passRate * 100).toFixed(0)}
            <span className="text-xs text-slate-500 font-normal ml-1">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summary.totalSamples} 个样本
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-slate-300 mb-2">质量等级分布</div>
        <div className="space-y-1.5">
          {gradePercentages.map(({ grade, count, pct }) => (
            <div key={grade} className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: QUALITY_GRADE_BG[grade], color: QUALITY_GRADE_COLORS[grade] }}
              >
                {grade}
              </span>
              <div className="flex-1">
                <div className="h-5 bg-slate-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: QUALITY_GRADE_COLORS[grade] }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-300 w-16 text-right tabular-nums">
                {count} ({pct.toFixed(0)}%)
              </span>
              <span className="text-[10px] text-slate-500 w-14 hidden sm:block">
                {QUALITY_GRADE_LABELS[grade]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-slate-300 mb-2">生产建议分布</div>
        <div className="grid grid-cols-4 gap-2">
          {advicePercentages.map(({ advice, count, pct }) => (
            <div
              key={advice}
              className="rounded-xl p-2.5 text-center border"
              style={{
                backgroundColor: `${PRODUCTION_ADVICE_COLORS[advice]}10`,
                borderColor: `${PRODUCTION_ADVICE_COLORS[advice]}30`,
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: PRODUCTION_ADVICE_COLORS[advice] }}
              >
                {count}
              </div>
              <div className="text-[10px] text-slate-400">{PRODUCTION_ADVICE_LABELS[advice]}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{pct.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="mb-4 p-3 bg-red-950/30 rounded-xl border border-red-800/40">
          <div className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            异常检测 ({anomalies.length} 项)
          </div>
          <ul className="space-y-1">
            {anomalies.map((a, i) => (
              <li key={i} className="text-xs text-red-200/90 flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5">⚠</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40">
          <div className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            优化建议
          </div>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="text-xs text-emerald-200/90 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
