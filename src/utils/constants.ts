import type { ParamRange, YarnParams } from '@/types';

export const PARAM_RANGES: Record<keyof YarnParams, ParamRange> = {
  spindleSpeed: {
    min: 10,
    max: 300,
    step: 1,
    default: 120,
    unit: 'rpm',
    label: '纺车转速',
  },
  draftSpeed: {
    min: 0.5,
    max: 20,
    step: 0.1,
    default: 5,
    unit: 'm/min',
    label: '牵伸速度',
  },
  fiberLength: {
    min: 10,
    max: 100,
    step: 1,
    default: 40,
    unit: 'mm',
    label: '纤维长度',
  },
};

export const DEFAULT_PARAMS: YarnParams = {
  spindleSpeed: PARAM_RANGES.spindleSpeed.default,
  draftSpeed: PARAM_RANGES.draftSpeed.default,
  fiberLength: PARAM_RANGES.fiberLength.default,
};

export const TWIST_THRESHOLDS = {
  lowMax: 300,
  optimalMax: 800,
};

export const BREAK_RISK_THRESHOLD = 70;
export const FEASIBLE_UNIFORMITY_MIN = 40;

export const TWIST_LEVEL_COLORS = {
  low: '#0284C7',
  optimal: '#059669',
  high: '#D97706',
};

export const TWIST_LEVEL_BG = {
  low: 'rgba(2,132,199,0.15)',
  optimal: 'rgba(5,150,105,0.15)',
  high: 'rgba(217,119,6,0.15)',
};

export const TWIST_LEVEL_LABELS: Record<string, string> = {
  low: '低捻',
  optimal: '适中',
  high: '过捻',
};

export const STORAGE_KEY = 'yarn-twist-experiments';
export const PLAYBACK_STORAGE_KEY = 'yarn-twist-playback-records';
export const OPTIMIZATION_STORAGE_KEY = 'yarn-twist-optimization-records';
export const BATCH_STORAGE_KEY = 'yarn-twist-batch-records';
export const KEYFRAME_THROTTLE_MS = 200;
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4];

export const QUALITY_GRADE_THRESHOLDS = {
  S: 90,
  A: 75,
  B: 60,
  C: 40,
  D: 0,
};

export const QUALITY_GRADE_LABELS: Record<string, string> = {
  S: '特级优质',
  A: '优质',
  B: '合格',
  C: '待改进',
  D: '不合格',
};

export const QUALITY_GRADE_COLORS: Record<string, string> = {
  S: '#a855f7',
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

export const QUALITY_GRADE_BG: Record<string, string> = {
  S: 'rgba(168, 85, 247, 0.15)',
  A: 'rgba(16, 185, 129, 0.15)',
  B: 'rgba(59, 130, 246, 0.15)',
  C: 'rgba(245, 158, 11, 0.15)',
  D: 'rgba(239, 68, 68, 0.15)',
};

export const PRODUCTION_ADVICE_LABELS: Record<string, string> = {
  pass: '直接投产',
  adjust: '微调后投产',
  warning: '谨慎投产',
  reject: '禁止投产',
};

export const PRODUCTION_ADVICE_COLORS: Record<string, string> = {
  pass: '#10b981',
  adjust: '#3b82f6',
  warning: '#f59e0b',
  reject: '#ef4444',
};

export const BATCH_CATEGORY_LABELS: Record<string, string> = {
  premium: '优质批次',
  normal: '正常批次',
  risk: '风险批次',
  reject: '不合格批次',
};

export const BATCH_CATEGORY_COLORS: Record<string, string> = {
  premium: '#a855f7',
  normal: '#10b981',
  risk: '#f59e0b',
  reject: '#ef4444',
};
