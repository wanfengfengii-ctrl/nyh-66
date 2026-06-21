import { create } from 'zustand';
import type { YarnParams, Experiment, Recommendation, RecommendTarget } from '@/types';
import { DEFAULT_PARAMS, STORAGE_KEY, PARAM_RANGES, TWIST_THRESHOLDS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { calculateYarnMetrics, generateId, recommendByTargetTwist, recommendByStability } from '@/utils/calculations';

interface YarnStore {
  params: YarnParams;
  experiments: Experiment[];
  selectedIds: string[];
  recommendTarget: RecommendTarget;
  targetTwist: number;
  targetBreakRisk: number;
  targetUniformity: number;
  setParams: (params: Partial<YarnParams>) => void;
  resetParams: () => void;
  saveExperiment: (name: string) => boolean;
  deleteExperiment: (id: string) => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  loadExperiments: () => void;
  setRecommendTarget: (target: RecommendTarget) => void;
  setTargetTwist: (value: number) => void;
  setTargetBreakRisk: (value: number) => void;
  setTargetUniformity: (value: number) => void;
  getRecommendations: () => Recommendation[];
  applyRecommendation: (rec: Recommendation) => void;
  exportReport: () => string;
}

function loadFromStorage(): Experiment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    console.error('Failed to load experiments from storage');
  }
  return [];
}

function saveToStorage(experiments: Experiment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
  } catch {
    console.error('Failed to save experiments to storage');
  }
}

export const useYarnStore = create<YarnStore>((set, get) => ({
  params: DEFAULT_PARAMS,
  experiments: [],
  selectedIds: [],
  recommendTarget: 'twist',
  targetTwist: 500,
  targetBreakRisk: 50,
  targetUniformity: 70,

  setParams: (newParams) => {
    set((state) => ({
      params: { ...state.params, ...newParams },
    }));
  },

  resetParams: () => {
    set({ params: DEFAULT_PARAMS });
  },

  saveExperiment: (name) => {
    const { params, experiments } = get();
    const metrics = calculateYarnMetrics(params);

    if (!metrics.isFeasible) return false;

    const newExperiment: Experiment = {
      id: generateId(),
      name: name.trim() || `实验 ${experiments.length + 1}`,
      params: { ...params },
      metrics,
      createdAt: Date.now(),
    };

    const updated = [...experiments, newExperiment];
    set({ experiments: updated });
    saveToStorage(updated);
    return true;
  },

  deleteExperiment: (id) => {
    set((state) => {
      const updated = state.experiments.filter((e) => e.id !== id);
      const updatedSelected = state.selectedIds.filter((sid) => sid !== id);
      saveToStorage(updated);
      return { experiments: updated, selectedIds: updatedSelected };
    });
  },

  toggleSelected: (id) => {
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelected: () => {
    set({ selectedIds: [] });
  },

  loadExperiments: () => {
    const experiments = loadFromStorage();
    set({ experiments });
  },

  setRecommendTarget: (target) => {
    set({ recommendTarget: target });
  },

  setTargetTwist: (value) => {
    set({ targetTwist: value });
  },

  setTargetBreakRisk: (value) => {
    set({ targetBreakRisk: value });
  },

  setTargetUniformity: (value) => {
    set({ targetUniformity: value });
  },

  getRecommendations: () => {
    const { params, recommendTarget, targetTwist, targetBreakRisk, targetUniformity } = get();
    if (recommendTarget === 'twist') {
      return recommendByTargetTwist(params, targetTwist);
    }
    return recommendByStability(params, targetBreakRisk, targetUniformity);
  },

  applyRecommendation: (rec) => {
    set({ params: { ...rec.params } });
  },

  exportReport: () => {
    const { params, experiments, selectedIds } = get();
    const metrics = calculateYarnMetrics(params);
    const selected = experiments.filter((e) => selectedIds.includes(e.id));
    const twistLabel = (level: string) => TWIST_LEVEL_LABELS[level] || level;

    const lines: string[] = [];
    lines.push('═══════════════════════════════════════');
    lines.push('         纺车捻度模拟器 · 实验报告        ');
    lines.push('═══════════════════════════════════════');
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');

    lines.push('── 当前工艺参数 ──');
    lines.push(`  纺车转速: ${params.spindleSpeed} rpm`);
    lines.push(`  牵伸速度: ${params.draftSpeed} m/min`);
    lines.push(`  纤维长度: ${params.fiberLength} mm`);
    lines.push('');

    lines.push('── 当前指标 ──');
    lines.push(`  捻度: ${metrics.twist.toFixed(1)} 捻/m [${twistLabel(metrics.twistLevel)}]`);
    lines.push(`  断线风险: ${metrics.breakRisk}%`);
    lines.push(`  均匀度: ${metrics.uniformity} 分`);
    lines.push(`  可行性: ${metrics.isFeasible ? '✓ 可行' : '✗ 不可行'}`);
    lines.push('');

    lines.push('── 捻度阈值参考 ──');
    lines.push(`  低捻区间: < ${TWIST_THRESHOLDS.lowMax} 捻/m`);
    lines.push(`  适中区间: ${TWIST_THRESHOLDS.lowMax} ~ ${TWIST_THRESHOLDS.optimalMax} 捻/m`);
    lines.push(`  过捻区间: > ${TWIST_THRESHOLDS.optimalMax} 捻/m`);
    lines.push('');

    if (selected.length > 0) {
      lines.push('── 对比方案 ──');
      selected.forEach((exp, i) => {
        lines.push(`  [${i + 1}] ${exp.name} (${twistLabel(exp.metrics.twistLevel)})`);
        lines.push(`      转速: ${exp.params.spindleSpeed} rpm | 牵伸: ${exp.params.draftSpeed} m/min | 纤维: ${exp.params.fiberLength} mm`);
        lines.push(`      捻度: ${exp.metrics.twist.toFixed(1)} 捻/m | 风险: ${exp.metrics.breakRisk}% | 均匀度: ${exp.metrics.uniformity} 分`);
        lines.push('');
      });
    }

    lines.push('── 全部实验历史 ──');
    if (experiments.length === 0) {
      lines.push('  （暂无实验记录）');
    } else {
      experiments.forEach((exp, i) => {
        lines.push(`  [${i + 1}] ${exp.name} [${twistLabel(exp.metrics.twistLevel)}] 捻度:${exp.metrics.twist.toFixed(1)} 风险:${exp.metrics.breakRisk}% 均匀度:${exp.metrics.uniformity}分`);
      });
    }
    lines.push('');
    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  },
}));
