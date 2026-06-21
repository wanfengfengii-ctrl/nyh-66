import { create } from 'zustand';
import type { YarnParams, Experiment, Recommendation, RecommendTarget, Keyframe, PlaybackRecord, PlaybackState, OptimizedScheme, OptimizationSortKey, AlertItem, OptimizationRecord } from '@/types';
import { DEFAULT_PARAMS, STORAGE_KEY, PLAYBACK_STORAGE_KEY, OPTIMIZATION_STORAGE_KEY, TWIST_THRESHOLDS, TWIST_LEVEL_LABELS, KEYFRAME_THROTTLE_MS } from '@/utils/constants';
import { calculateYarnMetrics, generateId, recommendByTargetTwist, recommendByStability, generateMultiObjectiveSchemes, sortSchemes, detectAnomalies, assessSchemeRisk } from '@/utils/calculations';

interface YarnStore {
  params: YarnParams;
  experiments: Experiment[];
  selectedIds: string[];
  recommendTarget: RecommendTarget;
  targetTwist: number;
  targetBreakRisk: number;
  targetUniformity: number;
  playback: PlaybackState;
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
  startRecording: () => void;
  stopRecording: () => void;
  recordKeyframe: (isKeyChange?: boolean) => void;
  clearKeyframes: () => void;
  startPlayback: () => void;
  pausePlayback: () => void;
  stopPlayback: () => void;
  seekTo: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  goToKeyframe: (index: number) => void;
  savePlaybackRecord: (name: string) => boolean;
  deletePlaybackRecord: (id: string) => void;
  loadPlaybackRecord: (record: PlaybackRecord) => void;
  unloadPlaybackRecord: () => void;
  loadPlaybackRecords: () => void;
  getPlaybackParams: () => YarnParams | null;
  getPlaybackMetrics: () => ReturnType<typeof calculateYarnMetrics> | null;
  setAutoRecord: (enabled: boolean) => void;
  optimizationTargets: {
    targetTwist: number;
    maxBreakRisk: number;
    minUniformity: number;
  };
  optimizationSchemes: OptimizedScheme[];
  optimizationSortKey: OptimizationSortKey;
  alerts: AlertItem[];
  optimizationRecords: OptimizationRecord[];
  autoGenerate: boolean;
  realtimeMonitor: boolean;
  selectedSchemeIds: string[];
  setOptimizationTargets: (targets: Partial<{ targetTwist: number; maxBreakRisk: number; minUniformity: number }>) => void;
  generateSchemes: () => void;
  setOptimizationSortKey: (key: OptimizationSortKey) => void;
  getSortedSchemes: () => OptimizedScheme[];
  applyOptimizedScheme: (scheme: OptimizedScheme) => void;
  addSchemeToCompare: (scheme: OptimizedScheme) => void;
  saveOptimizationRecord: (scheme: OptimizedScheme, name: string) => boolean;
  deleteOptimizationRecord: (id: string) => void;
  loadOptimizationRecords: () => void;
  refreshAlerts: () => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  setAutoGenerate: (enabled: boolean) => void;
  setRealtimeMonitor: (enabled: boolean) => void;
  toggleSchemeSelection: (id: string) => void;
  clearSchemeSelection: () => void;
  addSelectedSchemesToCompare: () => void;
  getSchemeRiskLevel: (scheme: OptimizedScheme) => 'high' | 'medium' | 'low';
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

function loadPlaybackFromStorage(): PlaybackRecord[] {
  try {
    const data = localStorage.getItem(PLAYBACK_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    console.error('Failed to load playback records from storage');
  }
  return [];
}

function savePlaybackToStorage(records: PlaybackRecord[]) {
  try {
    localStorage.setItem(PLAYBACK_STORAGE_KEY, JSON.stringify(records));
  } catch {
    console.error('Failed to save playback records to storage');
  }
}

function loadOptimizationFromStorage(): OptimizationRecord[] {
  try {
    const data = localStorage.getItem(OPTIMIZATION_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    console.error('Failed to load optimization records from storage');
  }
  return [];
}

function saveOptimizationToStorage(records: OptimizationRecord[]) {
  try {
    localStorage.setItem(OPTIMIZATION_STORAGE_KEY, JSON.stringify(records));
  } catch {
    console.error('Failed to save optimization records to storage');
  }
}

function createInitialPlaybackState(): PlaybackState {
  return {
    isRecording: false,
    isPlaying: false,
    isPaused: false,
    isPlaybackView: false,
    autoRecord: true,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1,
    keyframes: [],
    currentKeyframeIdx: -1,
    savedRecords: [],
    loadedRecord: null,
  };
}

let lastRecordTime = 0;
let recordingStartTime = 0;

function findKeyframeAtTime(keyframes: Keyframe[], time: number): { idx: number; keyframe: Keyframe | null } {
  if (keyframes.length === 0) return { idx: -1, keyframe: null };
  if (time <= keyframes[0].timestamp) return { idx: 0, keyframe: keyframes[0] };
  if (time >= keyframes[keyframes.length - 1].timestamp) return { idx: keyframes.length - 1, keyframe: keyframes[keyframes.length - 1] };

  for (let i = 1; i < keyframes.length; i++) {
    if (time < keyframes[i].timestamp) {
      const prev = keyframes[i - 1];
      const next = keyframes[i];
      const ratio = (time - prev.timestamp) / (next.timestamp - prev.timestamp);
      const interpolated: Keyframe = {
        id: prev.id,
        timestamp: time,
        params: {
          spindleSpeed: prev.params.spindleSpeed + (next.params.spindleSpeed - prev.params.spindleSpeed) * ratio,
          draftSpeed: prev.params.draftSpeed + (next.params.draftSpeed - prev.params.draftSpeed) * ratio,
          fiberLength: prev.params.fiberLength + (next.params.fiberLength - prev.params.fiberLength) * ratio,
        },
        metrics: {
          twist: prev.metrics.twist + (next.metrics.twist - prev.metrics.twist) * ratio,
          twistLevel: next.metrics.twistLevel,
          breakRisk: Math.round(prev.metrics.breakRisk + (next.metrics.breakRisk - prev.metrics.breakRisk) * ratio),
          uniformity: Math.round(prev.metrics.uniformity + (next.metrics.uniformity - prev.metrics.uniformity) * ratio),
          isFeasible: next.metrics.isFeasible,
        },
      };
      return { idx: i - 1, keyframe: interpolated };
    }
  }
  return { idx: keyframes.length - 1, keyframe: keyframes[keyframes.length - 1] };
}

export const useYarnStore = create<YarnStore>((set, get) => ({
  params: DEFAULT_PARAMS,
  experiments: [],
  selectedIds: [],
  recommendTarget: 'twist',
  targetTwist: 500,
  targetBreakRisk: 50,
  targetUniformity: 70,
  playback: createInitialPlaybackState(),
  optimizationTargets: {
    targetTwist: 500,
    maxBreakRisk: 50,
    minUniformity: 70,
  },
  optimizationSchemes: [],
  optimizationSortKey: 'compliance',
  alerts: [],
  optimizationRecords: [],
  autoGenerate: true,
  realtimeMonitor: true,
  selectedSchemeIds: [],

  setParams: (newParams) => {
    const { playback } = get();
    set((state) => ({
      params: { ...state.params, ...newParams },
    }));

    if (playback.autoRecord && !playback.isRecording && !playback.isPlaybackView && playback.keyframes.length === 0) {
      get().startRecording();
    } else if (playback.isRecording) {
      get().recordKeyframe(true);
    }
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

  startRecording: () => {
    const { params, playback } = get();
    if (playback.isRecording) return;
    const metrics = calculateYarnMetrics(params);
    const now = Date.now();
    recordingStartTime = now;
    lastRecordTime = now;
    const firstKeyframe: Keyframe = {
      id: generateId(),
      timestamp: 0,
      params: { ...params },
      metrics,
      isKeyChange: true,
    };
    set({
      playback: {
        ...playback,
        isRecording: true,
        isPlaying: false,
        isPaused: false,
        isPlaybackView: false,
        currentTime: 0,
        duration: 0,
        keyframes: [firstKeyframe],
        currentKeyframeIdx: 0,
        loadedRecord: null,
      },
    });
  },

  stopRecording: () => {
    const { playback } = get();
    if (!playback.isRecording) return;
    const duration = playback.keyframes.length > 0
      ? playback.keyframes[playback.keyframes.length - 1].timestamp
      : 0;
    set({
      playback: {
        ...playback,
        isRecording: false,
        isPlaybackView: true,
        duration,
        currentTime: 0,
        currentKeyframeIdx: 0,
      },
    });
  },

  recordKeyframe: (isKeyChange = false) => {
    const { params, playback } = get();
    if (!playback.isRecording) return;

    const now = Date.now();
    if (now - lastRecordTime < KEYFRAME_THROTTLE_MS && !isKeyChange) return;

    const lastKf = playback.keyframes[playback.keyframes.length - 1];
    const hasChanged = !lastKf ||
      lastKf.params.spindleSpeed !== params.spindleSpeed ||
      lastKf.params.draftSpeed !== params.draftSpeed ||
      lastKf.params.fiberLength !== params.fiberLength;

    if (!hasChanged && !isKeyChange) return;

    lastRecordTime = now;
    const metrics = calculateYarnMetrics(params);
    const timestamp = now - recordingStartTime;

    const newKeyframe: Keyframe = {
      id: generateId(),
      timestamp,
      params: { ...params },
      metrics,
      isKeyChange,
    };

    const newKeyframes = [...playback.keyframes, newKeyframe];
    set({
      playback: {
        ...playback,
        keyframes: newKeyframes,
        duration: timestamp,
        currentKeyframeIdx: newKeyframes.length - 1,
      },
    });
  },

  clearKeyframes: () => {
    const { playback } = get();
    set({
      playback: {
        ...playback,
        keyframes: [],
        currentTime: 0,
        duration: 0,
        currentKeyframeIdx: -1,
        isPlaying: false,
        isPaused: false,
        isPlaybackView: false,
        loadedRecord: null,
      },
    });
  },

  startPlayback: () => {
    const { playback } = get();
    if (playback.keyframes.length === 0) return;
    set({
      playback: {
        ...playback,
        isPlaying: true,
        isPaused: false,
        currentTime: playback.currentTime >= playback.duration ? 0 : playback.currentTime,
      },
    });
  },

  pausePlayback: () => {
    const { playback } = get();
    set({
      playback: {
        ...playback,
        isPlaying: false,
        isPaused: true,
      },
    });
  },

  stopPlayback: () => {
    const { playback } = get();
    set({
      playback: {
        ...playback,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        currentKeyframeIdx: 0,
      },
    });
  },

  seekTo: (time: number) => {
    const { playback } = get();
    const clampedTime = Math.max(0, Math.min(playback.duration, time));
    const { idx } = findKeyframeAtTime(playback.keyframes, clampedTime);
    set({
      playback: {
        ...playback,
        currentTime: clampedTime,
        currentKeyframeIdx: idx,
      },
    });
  },

  setPlaybackSpeed: (speed: number) => {
    const { playback } = get();
    set({
      playback: {
        ...playback,
        playbackSpeed: speed,
      },
    });
  },

  stepForward: () => {
    const { playback } = get();
    const nextIdx = Math.min(playback.keyframes.length - 1, playback.currentKeyframeIdx + 1);
    if (nextIdx >= 0 && nextIdx < playback.keyframes.length) {
      const kf = playback.keyframes[nextIdx];
      set({
        playback: {
          ...playback,
          currentTime: kf.timestamp,
          currentKeyframeIdx: nextIdx,
        },
      });
    }
  },

  stepBackward: () => {
    const { playback } = get();
    const prevIdx = Math.max(0, playback.currentKeyframeIdx - 1);
    if (prevIdx >= 0 && prevIdx < playback.keyframes.length) {
      const kf = playback.keyframes[prevIdx];
      set({
        playback: {
          ...playback,
          currentTime: kf.timestamp,
          currentKeyframeIdx: prevIdx,
        },
      });
    }
  },

  goToKeyframe: (index: number) => {
    const { playback } = get();
    if (index >= 0 && index < playback.keyframes.length) {
      const kf = playback.keyframes[index];
      set({
        playback: {
          ...playback,
          currentTime: kf.timestamp,
          currentKeyframeIdx: index,
        },
      });
    }
  },

  savePlaybackRecord: (name: string) => {
    const { playback } = get();
    if (playback.keyframes.length < 2) return false;

    const record: PlaybackRecord = {
      id: generateId(),
      name: name.trim() || `回放 ${playback.savedRecords.length + 1}`,
      keyframes: playback.keyframes,
      duration: playback.duration,
      createdAt: Date.now(),
    };

    const savedRecords = [...playback.savedRecords, record];
    set({
      playback: {
        ...playback,
        savedRecords,
      },
    });
    savePlaybackToStorage(savedRecords);
    return true;
  },

  deletePlaybackRecord: (id: string) => {
    const { playback } = get();
    const savedRecords = playback.savedRecords.filter((r) => r.id !== id);
    const loadedRecord = playback.loadedRecord?.id === id ? null : playback.loadedRecord;
    set({
      playback: {
        ...playback,
        savedRecords,
        loadedRecord,
      },
    });
    savePlaybackToStorage(savedRecords);
  },

  loadPlaybackRecord: (record: PlaybackRecord) => {
    set((state) => ({
      playback: {
        ...state.playback,
        keyframes: record.keyframes,
        duration: record.duration,
        currentTime: 0,
        currentKeyframeIdx: 0,
        isPlaying: false,
        isPaused: false,
        isRecording: false,
        isPlaybackView: true,
        loadedRecord: record,
      },
    }));
  },

  unloadPlaybackRecord: () => {
    set((state) => ({
      playback: {
        ...state.playback,
        keyframes: [],
        currentTime: 0,
        duration: 0,
        currentKeyframeIdx: -1,
        isPlaying: false,
        isPaused: false,
        isPlaybackView: false,
        loadedRecord: null,
      },
    }));
  },

  loadPlaybackRecords: () => {
    const savedRecords = loadPlaybackFromStorage();
    set((state) => ({
      playback: {
        ...state.playback,
        savedRecords,
      },
    }));
  },

  getPlaybackParams: () => {
    const { playback } = get();
    if (playback.keyframes.length === 0) return null;
    const { keyframe } = findKeyframeAtTime(playback.keyframes, playback.currentTime);
    return keyframe ? keyframe.params : null;
  },

  getPlaybackMetrics: () => {
    const { playback } = get();
    if (playback.keyframes.length === 0) return null;
    const { keyframe } = findKeyframeAtTime(playback.keyframes, playback.currentTime);
    return keyframe ? keyframe.metrics : null;
  },

  setAutoRecord: (enabled) => {
    const { playback } = get();
    set({
      playback: {
        ...playback,
        autoRecord: enabled,
      },
    });
  },

  setOptimizationTargets: (targets) => {
    set((state) => ({
      optimizationTargets: { ...state.optimizationTargets, ...targets },
    }));
    if (get().autoGenerate) {
      const { params } = get();
      const updatedTargets = { ...get().optimizationTargets, ...targets };
      const schemes = generateMultiObjectiveSchemes(
        params,
        updatedTargets.targetTwist,
        updatedTargets.maxBreakRisk,
        updatedTargets.minUniformity
      );
      set({ optimizationSchemes: schemes });
    }
  },

  generateSchemes: () => {
    const { params, optimizationTargets } = get();
    const schemes = generateMultiObjectiveSchemes(
      params,
      optimizationTargets.targetTwist,
      optimizationTargets.maxBreakRisk,
      optimizationTargets.minUniformity
    );
    set({ optimizationSchemes: schemes });
  },

  setOptimizationSortKey: (key) => {
    set({ optimizationSortKey: key });
  },

  getSortedSchemes: () => {
    const { optimizationSchemes, optimizationSortKey } = get();
    return sortSchemes(optimizationSchemes, optimizationSortKey);
  },

  applyOptimizedScheme: (scheme) => {
    set({ params: { ...scheme.params } });
  },

  addSchemeToCompare: (scheme) => {
    const { experiments } = get();
    const existing = experiments.find(
      (e) =>
        e.params.spindleSpeed === scheme.params.spindleSpeed &&
        e.params.draftSpeed === scheme.params.draftSpeed &&
        e.params.fiberLength === scheme.params.fiberLength
    );
    if (existing) {
      const { toggleSelected } = get();
      toggleSelected(existing.id);
      return;
    }
    const newExperiment: Experiment = {
      id: scheme.id,
      name: `优化方案 ${scheme.description.slice(0, 10)}`,
      params: { ...scheme.params },
      metrics: { ...scheme.metrics },
      createdAt: Date.now(),
    };
    const updated = [...experiments, newExperiment];
    set({ experiments: updated, selectedIds: [...get().selectedIds, newExperiment.id] });
    saveToStorage(updated);
  },

  saveOptimizationRecord: (scheme, name) => {
    const { optimizationTargets, optimizationRecords } = get();
    const record: OptimizationRecord = {
      id: generateId(),
      name: name.trim() || `优化记录 ${optimizationRecords.length + 1}`,
      scheme: { ...scheme },
      targets: { ...optimizationTargets },
      createdAt: Date.now(),
    };
    const updated = [...optimizationRecords, record];
    set({ optimizationRecords: updated });
    saveOptimizationToStorage(updated);
    return true;
  },

  deleteOptimizationRecord: (id) => {
    const { optimizationRecords } = get();
    const updated = optimizationRecords.filter((r) => r.id !== id);
    set({ optimizationRecords: updated });
    saveOptimizationToStorage(updated);
  },

  loadOptimizationRecords: () => {
    const records = loadOptimizationFromStorage();
    set({ optimizationRecords: records });
  },

  refreshAlerts: () => {
    const { params, playback } = get();
    const metrics = calculateYarnMetrics(params);
    const keyframes = playback.keyframes.length >= 3 ? playback.keyframes : undefined;
    const newAlerts = detectAnomalies(params, metrics, keyframes);
    set((state) => {
      const kept = state.alerts.filter((a) => a.dismissed);
      return { alerts: [...kept, ...newAlerts] };
    });
  },

  dismissAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  setAutoGenerate: (enabled) => {
    set({ autoGenerate: enabled });
    if (enabled && get().optimizationSchemes.length === 0) {
      get().generateSchemes();
    }
  },

  setRealtimeMonitor: (enabled) => {
    set({ realtimeMonitor: enabled });
  },

  toggleSchemeSelection: (id) => {
    set((state) => ({
      selectedSchemeIds: state.selectedSchemeIds.includes(id)
        ? state.selectedSchemeIds.filter((sid) => sid !== id)
        : [...state.selectedSchemeIds, id],
    }));
  },

  clearSchemeSelection: () => {
    set({ selectedSchemeIds: [] });
  },

  addSelectedSchemesToCompare: () => {
    const { optimizationSchemes, selectedSchemeIds } = get();
    const selectedSchemes = optimizationSchemes.filter((s) => selectedSchemeIds.includes(s.id));
    selectedSchemes.forEach((scheme) => {
      get().addSchemeToCompare(scheme);
    });
    set({ selectedSchemeIds: [] });
  },

  getSchemeRiskLevel: (scheme) => {
    return assessSchemeRisk(scheme);
  },
}));
