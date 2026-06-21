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

export interface Keyframe {
  id: string;
  timestamp: number;
  params: YarnParams;
  metrics: YarnMetrics;
  isKeyChange?: boolean;
}

export interface PlaybackRecord {
  id: string;
  name: string;
  keyframes: Keyframe[];
  duration: number;
  createdAt: number;
}

export interface PlaybackState {
  isRecording: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isPlaybackView: boolean;
  autoRecord: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  keyframes: Keyframe[];
  currentKeyframeIdx: number;
  savedRecords: PlaybackRecord[];
  loadedRecord: PlaybackRecord | null;
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
