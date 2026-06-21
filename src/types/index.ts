export interface YarnParams {
  spindleSpeed: number;
  draftSpeed: number;
  fiberLength: number;
}

export type TwistLevel = 'low' | 'optimal' | 'high';

export interface YarnMetrics {
  twist: number;
  twistLevel: TwistLevel;
  breakRisk: number;
  uniformity: number;
  isFeasible: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  params: YarnParams;
  metrics: YarnMetrics;
  createdAt: number;
}

export interface ParamRange {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  label: string;
}

export interface Recommendation {
  params: YarnParams;
  metrics: YarnMetrics;
  description: string;
  targetMet: boolean;
}

export interface StableIntervalPoint {
  value: number;
  breakRisk: number;
  uniformity: number;
  isFeasible: boolean;
  twistLevel: TwistLevel;
}

export interface StableInterval {
  param: keyof YarnParams;
  points: StableIntervalPoint[];
  currentIdx: number;
  lowBound: number;
  highBound: number;
}

export type RecommendTarget = 'twist' | 'stability';
