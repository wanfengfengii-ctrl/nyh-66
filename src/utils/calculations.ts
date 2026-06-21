import type { YarnParams, YarnMetrics, TwistLevel, Recommendation, StableInterval, StableIntervalPoint } from '@/types';
import {
  TWIST_THRESHOLDS,
  BREAK_RISK_THRESHOLD,
  FEASIBLE_UNIFORMITY_MIN,
  PARAM_RANGES,
} from './constants';

export function calculateTwist(params: YarnParams): number {
  const { spindleSpeed, draftSpeed } = params;
  const twistPerMeter = (spindleSpeed / draftSpeed) * 10;
  return Math.round(twistPerMeter * 10) / 10;
}

export function getTwistLevel(twist: number): TwistLevel {
  if (twist < TWIST_THRESHOLDS.lowMax) return 'low';
  if (twist <= TWIST_THRESHOLDS.optimalMax) return 'optimal';
  return 'high';
}

export function calculateBreakRisk(params: YarnParams, twist: number): number {
  const { fiberLength } = params;

  const lowRisk = Math.max(0, (twist - TWIST_THRESHOLDS.lowMax) * 0.02);
  const highRisk = twist > TWIST_THRESHOLDS.optimalMax
    ? (twist - TWIST_THRESHOLDS.optimalMax) * 0.15
    : 0;
  const twistRiskFactor = lowRisk + highRisk;
  const fiberRiskFactor = Math.max(0, (50 - fiberLength) * 0.8);
  const baseRisk = 10;

  const risk = baseRisk + twistRiskFactor + fiberRiskFactor;
  return Math.min(100, Math.max(0, Math.round(risk)));
}

export function calculateUniformity(params: YarnParams, twist: number): number {
  const { fiberLength } = params;

  const optimalTwist = (TWIST_THRESHOLDS.lowMax + TWIST_THRESHOLDS.optimalMax) / 2;
  const twistDeviation = Math.abs(twist - optimalTwist);
  const twistPenalty = twistDeviation * 0.08;

  const fiberBonus = Math.max(0, (fiberLength - 30) * 0.3);

  const baseUniformity = 85;
  const uniformity = baseUniformity - twistPenalty + fiberBonus;

  return Math.min(100, Math.max(0, Math.round(uniformity)));
}

export function checkFeasibility(
  breakRisk: number,
  uniformity: number,
  params: YarnParams
): boolean {
  const { spindleSpeed, draftSpeed, fiberLength } = params;

  if (spindleSpeed <= 0 || draftSpeed <= 0 || fiberLength <= 0) return false;
  if (breakRisk >= BREAK_RISK_THRESHOLD) return false;
  if (uniformity < FEASIBLE_UNIFORMITY_MIN) return false;

  return true;
}

export function calculateYarnMetrics(params: YarnParams): YarnMetrics {
  const twist = calculateTwist(params);
  const twistLevel = getTwistLevel(twist);
  const breakRisk = calculateBreakRisk(params, twist);
  const uniformity = calculateUniformity(params, twist);
  const isFeasible = checkFeasibility(breakRisk, uniformity, params);

  return {
    twist,
    twistLevel,
    breakRisk,
    uniformity,
    isFeasible,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function recommendByTargetTwist(
  currentParams: YarnParams,
  targetTwist: number
): Recommendation[] {
  const results: Recommendation[] = [];
  const { fiberLength } = currentParams;

  const speedRange = PARAM_RANGES.spindleSpeed;
  const draftRange = PARAM_RANGES.draftSpeed;

  const baseDraft = currentParams.draftSpeed;
  const neededSpeed = (targetTwist / 10) * baseDraft;
  const clampedSpeed = Math.max(speedRange.min, Math.min(speedRange.max, Math.round(neededSpeed)));
  const p1: YarnParams = { spindleSpeed: clampedSpeed, draftSpeed: baseDraft, fiberLength };
  const m1 = calculateYarnMetrics(p1);
  if (m1.isFeasible) {
    const absDiff = Math.abs(m1.twist - targetTwist);
    const isReached = absDiff < 50;
    const rawDiff = m1.twist - targetTwist;
    const diffStr = rawDiff > 0 ? `+${rawDiff.toFixed(0)}` : rawDiff.toFixed(0);
    const desc = isReached
      ? `调整转速至 ${clampedSpeed} rpm（牵伸不变）`
      : `转速限制下最接近：${clampedSpeed} rpm（实际捻度 ${diffStr}）`;
    results.push({
      params: p1,
      metrics: m1,
      description: desc,
      targetMet: absDiff < 50,
    });
  }

  const baseSpeed2 = currentParams.spindleSpeed;
  const neededDraft = (baseSpeed2 / targetTwist) * 10;
  const clampedDraft = Math.max(draftRange.min, Math.min(draftRange.max, Math.round(neededDraft * 10) / 10));
  const p2: YarnParams = { spindleSpeed: baseSpeed2, draftSpeed: clampedDraft, fiberLength };
  const m2 = calculateYarnMetrics(p2);
  if (m2.isFeasible) {
    const absDiff = Math.abs(m2.twist - targetTwist);
    const isReached = absDiff < 50;
    const rawDiff = m2.twist - targetTwist;
    const diffStr = rawDiff > 0 ? `+${rawDiff.toFixed(0)}` : rawDiff.toFixed(0);
    const desc = isReached
      ? `调整牵伸至 ${clampedDraft} m/min（转速不变）`
      : `牵伸限制下最接近：${clampedDraft} m/min（实际捻度 ${diffStr}）`;
    results.push({
      params: p2,
      metrics: m2,
      description: desc,
      targetMet: absDiff < 50,
    });
  }

  const optimalDraft = 5;
  const optimalSpeed = (targetTwist / 10) * optimalDraft;
  const clampedOptSpeed = Math.max(speedRange.min, Math.min(speedRange.max, Math.round(optimalSpeed)));
  const p3: YarnParams = { spindleSpeed: clampedOptSpeed, draftSpeed: optimalDraft, fiberLength };
  const m3 = calculateYarnMetrics(p3);
  if (m3.isFeasible && !(clampedOptSpeed === clampedSpeed && optimalDraft === baseDraft)) {
    const absDiff = Math.abs(m3.twist - targetTwist);
    const isReached = absDiff < 50;
    const rawDiff = m3.twist - targetTwist;
    const diffStr = rawDiff > 0 ? `+${rawDiff.toFixed(0)}` : rawDiff.toFixed(0);
    const desc = isReached
      ? `推荐转速 ${clampedOptSpeed} rpm + 牵伸 ${optimalDraft} m/min`
      : `综合方案：${clampedOptSpeed} rpm / ${optimalDraft} m/min（实际捻度 ${diffStr}）`;
    results.push({
      params: p3,
      metrics: m3,
      description: desc,
      targetMet: absDiff < 50,
    });
  }

  const sorted = results
    .slice()
    .sort((a, b) => Math.abs(a.metrics.twist - targetTwist) - Math.abs(b.metrics.twist - targetTwist));

  const topResults = sorted.slice(0, 3);
  const bestDiff = topResults.length > 0 ? Math.abs(topResults[0].metrics.twist - targetTwist) : Infinity;

  if (bestDiff > 300) {
    return [];
  }

  return topResults;
}

export function recommendByStability(
  currentParams: YarnParams,
  targetBreakRisk: number,
  targetUniformity: number
): Recommendation[] {
  const results: Recommendation[] = [];
  const { fiberLength } = currentParams;
  const speedRange = PARAM_RANGES.spindleSpeed;

  const optimalTwist = (TWIST_THRESHOLDS.lowMax + TWIST_THRESHOLDS.optimalMax) / 2;
  const baseDraft = currentParams.draftSpeed;
  const speedForOptimal = (optimalTwist / 10) * baseDraft;
  const clampedSpeed = Math.max(speedRange.min, Math.min(speedRange.max, Math.round(speedForOptimal)));
  const p1: YarnParams = { spindleSpeed: clampedSpeed, draftSpeed: baseDraft, fiberLength };
  const m1 = calculateYarnMetrics(p1);
  if (m1.isFeasible && m1.breakRisk <= targetBreakRisk && m1.uniformity >= targetUniformity) {
    results.push({
      params: p1,
      metrics: m1,
      description: `适中捻度：转速 ${clampedSpeed} rpm（风险 ${m1.breakRisk}%，均匀度 ${m1.uniformity}）`,
      targetMet: true,
    });
  }

  const lowOptimalTwist = TWIST_THRESHOLDS.lowMax + 50;
  const speedForLow = (lowOptimalTwist / 10) * baseDraft;
  const clampedSpeedLow = Math.max(speedRange.min, Math.min(speedRange.max, Math.round(speedForLow)));
  const p2: YarnParams = { spindleSpeed: clampedSpeedLow, draftSpeed: baseDraft, fiberLength };
  const m2 = calculateYarnMetrics(p2);
  if (m2.isFeasible && m2.breakRisk <= targetBreakRisk && m2.uniformity >= targetUniformity) {
    results.push({
      params: p2,
      metrics: m2,
      description: `低风险方案：转速 ${clampedSpeedLow} rpm（风险 ${m2.breakRisk}%，均匀度 ${m2.uniformity}）`,
      targetMet: true,
    });
  }

  const highOptimalTwist = TWIST_THRESHOLDS.optimalMax - 50;
  const speedForHigh = (highOptimalTwist / 10) * baseDraft;
  const clampedSpeedHigh = Math.max(speedRange.min, Math.min(speedRange.max, Math.round(speedForHigh)));
  const p3: YarnParams = { spindleSpeed: clampedSpeedHigh, draftSpeed: baseDraft, fiberLength };
  const m3 = calculateYarnMetrics(p3);
  if (m3.isFeasible && m3.breakRisk <= targetBreakRisk && m3.uniformity >= targetUniformity) {
    results.push({
      params: p3,
      metrics: m3,
      description: `高均匀度方案：转速 ${clampedSpeedHigh} rpm（风险 ${m3.breakRisk}%，均匀度 ${m3.uniformity}）`,
      targetMet: true,
    });
  }

  return results;
}

export function calculateStableIntervals(currentParams: YarnParams): StableInterval[] {
  const params = (Object.keys(PARAM_RANGES) as Array<keyof YarnParams>).map((paramKey) => {
    const range = PARAM_RANGES[paramKey];
    const currentVal = currentParams[paramKey];
    const points: StableIntervalPoint[] = [];
    const step = range.step;
    const numSteps = 60;

    let lowBound = range.max;
    let highBound = range.min;
    let currentIdx = 0;

    for (let i = 0; i <= numSteps; i++) {
      const val = Math.max(range.min, Math.min(range.max, range.min + (i / numSteps) * (range.max - range.min)));
      const stepped = paramKey === 'draftSpeed'
        ? Math.round(val * 10) / 10
        : Math.round(val);
      const testParams = { ...currentParams, [paramKey]: stepped };
      const metrics = calculateYarnMetrics(testParams);
      const point: StableIntervalPoint = {
        value: stepped,
        breakRisk: metrics.breakRisk,
        uniformity: metrics.uniformity,
        isFeasible: metrics.isFeasible,
        twistLevel: metrics.twistLevel,
      };
      points.push(point);

      if (metrics.isFeasible) {
        lowBound = Math.min(lowBound, stepped);
        highBound = Math.max(highBound, stepped);
      }

      if (Math.abs(stepped - currentVal) < step * 0.6) {
        currentIdx = i;
      }
    }

    return {
      param: paramKey,
      points,
      currentIdx,
      lowBound,
      highBound,
    };
  });

  return params;
}
