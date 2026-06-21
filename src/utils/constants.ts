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
export const KEYFRAME_THROTTLE_MS = 200;
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4];
