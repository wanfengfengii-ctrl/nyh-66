import type { YarnParams, YarnMetrics, TwistLevel, Recommendation, StableInterval, StableIntervalPoint, OptimizedScheme, AlertItem } from '@/types';
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

export function calculateStabilityScore(
  metrics: YarnMetrics,
  maxBreakRisk: number,
  minUniformity: number
): number {
  const riskMargin = maxBreakRisk - metrics.breakRisk;
  const riskScore = Math.min(100, Math.max(0, (riskMargin / maxBreakRisk) * 70 + (metrics.breakRisk < 30 ? 30 : 0)));

  const uniformityMargin = metrics.uniformity - minUniformity;
  const uniformityScore = Math.min(100, Math.max(0, (uniformityMargin / (100 - minUniformity)) * 70 + (metrics.uniformity > 80 ? 30 : 0)));

  const feasibilityBonus = metrics.isFeasible ? 10 : -30;
  const twistLevelBonus = metrics.twistLevel === 'optimal' ? 10 : metrics.twistLevel === 'low' ? 0 : -5;

  const raw = (riskScore * 0.5 + uniformityScore * 0.5) + feasibilityBonus + twistLevelBonus;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function calculateComplianceScore(
  metrics: YarnMetrics,
  targetTwist: number,
  maxBreakRisk: number,
  minUniformity: number
): number {
  const twistRange = 1200;
  const twistDiff = Math.abs(metrics.twist - targetTwist);
  const twistScore = Math.max(0, (1 - twistDiff / twistRange) * 100);

  const riskCompliance = metrics.breakRisk <= maxBreakRisk ? 100 : Math.max(0, 100 - (metrics.breakRisk - maxBreakRisk) * 5);
  const uniformityCompliance = metrics.uniformity >= minUniformity ? 100 : Math.max(0, 100 - (minUniformity - metrics.uniformity) * 5);

  const raw = twistScore * 0.4 + riskCompliance * 0.3 + uniformityCompliance * 0.3;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function calculateCostScore(params: YarnParams): number {
  const speedRatio = params.spindleSpeed / PARAM_RANGES.spindleSpeed.max;
  const draftRatio = params.draftSpeed / PARAM_RANGES.draftSpeed.max;

  const energyCost = speedRatio * 0.6;
  const materialCost = (1 - draftRatio) * 0.2;
  const totalCostRatio = energyCost + materialCost + 0.2;

  const score = (1 - Math.min(1, totalCostRatio)) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function generateMultiObjectiveSchemes(
  currentParams: YarnParams,
  targetTwist: number,
  maxBreakRisk: number,
  minUniformity: number
): OptimizedScheme[] {
  const results: OptimizedScheme[] = [];
  const seen = new Set<string>();
  const { fiberLength } = currentParams;
  const speedRange = PARAM_RANGES.spindleSpeed;
  const draftRange = PARAM_RANGES.draftSpeed;

  const speedSteps = [0.2, 0.35, 0.5, 0.65, 0.8, 0.95];
  const draftSteps = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];

  const directDraft = currentParams.draftSpeed;
  const neededSpeed = (targetTwist / 10) * directDraft;
  const directSpeed = Math.max(speedRange.min, Math.min(speedRange.max, Math.round(neededSpeed)));

  const directParams: YarnParams = { spindleSpeed: directSpeed, draftSpeed: directDraft, fiberLength };
  const directMetrics = calculateYarnMetrics(directParams);
  const directKey = `${directParams.spindleSpeed}_${directParams.draftSpeed}`;
  if (!seen.has(directKey)) {
    seen.add(directKey);
    results.push({
      id: generateId(),
      params: directParams,
      metrics: directMetrics,
      stabilityScore: calculateStabilityScore(directMetrics, maxBreakRisk, minUniformity),
      complianceScore: calculateComplianceScore(directMetrics, targetTwist, maxBreakRisk, minUniformity),
      costScore: calculateCostScore(directParams),
      description: `直击目标捻度：转速 ${directSpeed} rpm（牵伸不变）`,
    });
  }

  const directSpeed2 = currentParams.spindleSpeed;
  const neededDraft = (directSpeed2 / targetTwist) * 10;
  const directDraft2 = Math.max(draftRange.min, Math.min(draftRange.max, Math.round(neededDraft * 10) / 10));
  const directParams2: YarnParams = { spindleSpeed: directSpeed2, draftSpeed: directDraft2, fiberLength };
  const directMetrics2 = calculateYarnMetrics(directParams2);
  const directKey2 = `${directParams2.spindleSpeed}_${directParams2.draftSpeed}`;
  if (!seen.has(directKey2)) {
    seen.add(directKey2);
    results.push({
      id: generateId(),
      params: directParams2,
      metrics: directMetrics2,
      stabilityScore: calculateStabilityScore(directMetrics2, maxBreakRisk, minUniformity),
      complianceScore: calculateComplianceScore(directMetrics2, targetTwist, maxBreakRisk, minUniformity),
      costScore: calculateCostScore(directParams2),
      description: `调整牵伸：${directDraft2} m/min（转速不变）`,
    });
  }

  for (const sRatio of speedSteps) {
    for (const dRatio of draftSteps) {
      const speed = Math.round(speedRange.min + sRatio * (speedRange.max - speedRange.min));
      const draft = Math.round((draftRange.min + dRatio * (draftRange.max - draftRange.min)) * 10) / 10;
      const key = `${speed}_${draft}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const testParams: YarnParams = { spindleSpeed: speed, draftSpeed: draft, fiberLength };
      const metrics = calculateYarnMetrics(testParams);

      if (!metrics.isFeasible) continue;
      if (metrics.breakRisk > maxBreakRisk) continue;
      if (metrics.uniformity < minUniformity) continue;

      const twistDiff = Math.abs(metrics.twist - targetTwist);
      if (twistDiff > targetTwist * 0.5) continue;

      const stabScore = calculateStabilityScore(metrics, maxBreakRisk, minUniformity);
      const compScore = calculateComplianceScore(metrics, targetTwist, maxBreakRisk, minUniformity);
      const costScore = calculateCostScore(testParams);

      let desc = '';
      if (compScore >= 80) {
        desc = `高度达标方案：${speed} rpm / ${draft} m/min`;
      } else if (stabScore >= 70) {
        desc = `高稳定性方案：${speed} rpm / ${draft} m/min`;
      } else if (costScore >= 70) {
        desc = `经济型方案：${speed} rpm / ${draft} m/min`;
      } else {
        desc = `综合方案：${speed} rpm / ${draft} m/min`;
      }

      results.push({
        id: generateId(),
        params: testParams,
        metrics,
        stabilityScore: stabScore,
        complianceScore: compScore,
        costScore,
        description: desc,
      });
    }
  }

  results.sort((a, b) => {
    const aTotal = a.stabilityScore * 0.35 + a.complianceScore * 0.4 + a.costScore * 0.25;
    const bTotal = b.stabilityScore * 0.35 + b.complianceScore * 0.4 + b.costScore * 0.25;
    return bTotal - aTotal;
  });

  return results.slice(0, 12);
}

export function sortSchemes(
  schemes: OptimizedScheme[],
  sortKey: 'stability' | 'compliance' | 'cost'
): OptimizedScheme[] {
  const sorted = [...schemes];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'stability':
        return b.stabilityScore - a.stabilityScore;
      case 'compliance':
        return b.complianceScore - a.complianceScore;
      case 'cost':
        return b.costScore - a.costScore;
    }
  });
  return sorted;
}

export function detectAnomalies(
  params: YarnParams,
  metrics: YarnMetrics,
  keyframes?: { metrics: YarnMetrics }[]
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = Date.now();

  if (metrics.breakRisk >= BREAK_RISK_THRESHOLD) {
    alerts.push({
      id: generateId(),
      type: 'high_risk',
      level: 'high',
      message: `断线风险 ${metrics.breakRisk}% 超过安全阈值 ${BREAK_RISK_THRESHOLD}%，当前参数组合属于高风险`,
      params: { ...params },
      metrics: { ...metrics },
      timestamp: now,
      dismissed: false,
    });
  } else if (metrics.breakRisk >= BREAK_RISK_THRESHOLD - 20) {
    alerts.push({
      id: generateId(),
      type: 'high_risk',
      level: 'medium',
      message: `断线风险 ${metrics.breakRisk}% 接近安全阈值，建议降低转速或提高牵伸速度`,
      params: { ...params },
      metrics: { ...metrics },
      timestamp: now,
      dismissed: false,
    });
  }

  if (!metrics.isFeasible) {
    alerts.push({
      id: generateId(),
      type: 'out_of_range',
      level: 'high',
      message: '当前参数超出稳定区间，均匀度不足或断线风险过高，不建议作为生产方案',
      params: { ...params },
      metrics: { ...metrics },
      timestamp: now,
      dismissed: false,
    });
  }

  if (metrics.uniformity < FEASIBLE_UNIFORMITY_MIN + 10) {
    alerts.push({
      id: generateId(),
      type: 'out_of_range',
      level: 'medium',
      message: `均匀度 ${metrics.uniformity} 分偏低，接近不可行边界 ${FEASIBLE_UNIFORMITY_MIN} 分`,
      params: { ...params },
      metrics: { ...metrics },
      timestamp: now,
      dismissed: false,
    });
  }

  if (metrics.twistLevel === 'high' && params.fiberLength < 30) {
    alerts.push({
      id: generateId(),
      type: 'high_risk',
      level: 'high',
      message: `过捻 + 短纤维(${params.fiberLength}mm)组合极度危险，断线概率极高`,
      params: { ...params },
      metrics: { ...metrics },
      timestamp: now,
      dismissed: false,
    });
  }

  if (keyframes && keyframes.length >= 3) {
    const twistValues = keyframes.map((kf) => kf.metrics.twist);
    const breakRiskValues = keyframes.map((kf) => kf.metrics.breakRisk);

    const twistStdDev = standardDeviation(twistValues);
    const twistMean = twistValues.reduce((a, b) => a + b, 0) / twistValues.length;
    const twistCV = twistMean > 0 ? twistStdDev / twistMean : 0;

    if (twistCV > 0.15) {
      alerts.push({
        id: generateId(),
        type: 'fluctuation',
        level: 'high',
        message: `回放过程中捻度波动过大（变异系数 ${((twistCV) * 100).toFixed(1)}%），工艺过程不稳定`,
        timestamp: now,
        dismissed: false,
      });
    } else if (twistCV > 0.08) {
      alerts.push({
        id: generateId(),
        type: 'fluctuation',
        level: 'medium',
        message: `回放过程中捻度存在波动（变异系数 ${((twistCV) * 100).toFixed(1)}%），建议关注工艺稳定性`,
        timestamp: now,
        dismissed: false,
      });
    }

    const maxRisk = Math.max(...breakRiskValues);
    const minRisk = Math.min(...breakRiskValues);
    if (maxRisk - minRisk > 30) {
      alerts.push({
        id: generateId(),
        type: 'fluctuation',
        level: 'medium',
        message: `回放中断线风险波动幅度 ${maxRisk - minRisk}% 过大，从 ${minRisk}% 到 ${maxRisk}%`,
        timestamp: now,
        dismissed: false,
      });
    }
  }

  const twistDeviation = Math.abs(metrics.twist - (TWIST_THRESHOLDS.lowMax + TWIST_THRESHOLDS.optimalMax) / 2);
  const maxSafeDeviation = (TWIST_THRESHOLDS.optimalMax - TWIST_THRESHOLDS.lowMax) / 2;
  if (twistDeviation > maxSafeDeviation * 1.5 && metrics.twistLevel !== 'optimal') {
    alerts.push({
      id: generateId(),
      type: 'out_of_range',
      level: 'low',
      message: `当前捻度 ${metrics.twist.toFixed(1)} 捻/m 偏离适中区间较多，可能影响纱线质量`,
      params: { ...params },
      metrics: { ...metrics },
      timestamp: now,
      dismissed: false,
    });
  }

  return alerts;
}

function standardDeviation(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squareDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / (n - 1));
}

export function assessSchemeRisk(scheme: OptimizedScheme): 'high' | 'medium' | 'low' {
  const { metrics, stabilityScore, complianceScore } = scheme;
  if (!metrics.isFeasible) return 'high';
  if (metrics.breakRisk >= BREAK_RISK_THRESHOLD - 10) return 'high';
  if (metrics.uniformity < FEASIBLE_UNIFORMITY_MIN + 10) return 'high';
  if (stabilityScore < 40 || complianceScore < 40) return 'high';
  if (metrics.breakRisk >= BREAK_RISK_THRESHOLD - 25) return 'medium';
  if (metrics.uniformity < FEASIBLE_UNIFORMITY_MIN + 20) return 'medium';
  if (stabilityScore < 60 || complianceScore < 60) return 'medium';
  return 'low';
}

export function detectSchemeAnomalies(schemes: OptimizedScheme[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = Date.now();

  const highRiskSchemes = schemes.filter((s) => !s.metrics.isFeasible || s.metrics.breakRisk >= BREAK_RISK_THRESHOLD);
  if (highRiskSchemes.length > 0 && schemes.length > 0) {
    const ratio = highRiskSchemes.length / schemes.length;
    if (ratio > 0.5) {
      alerts.push({
        id: generateId(),
        type: 'high_risk',
        level: 'high',
        message: `优化搜索结果中 ${highRiskSchemes.length}/${schemes.length} 组方案属于高风险，建议放宽目标约束条件`,
        timestamp: now,
        dismissed: false,
      });
    }
  }

  const allSameRisk = schemes.length > 0 && schemes.every((s) => s.metrics.breakRisk === schemes[0].metrics.breakRisk);
  if (allSameRisk && schemes.length > 3) {
    alerts.push({
      id: generateId(),
      type: 'fluctuation',
      level: 'low',
      message: '所有优化方案的断线风险相同，参数空间搜索可能受限，建议调整搜索范围',
      timestamp: now,
      dismissed: false,
    });
  }

  const veryHighStability = schemes.filter((s) => s.stabilityScore >= 90);
  const veryLowStability = schemes.filter((s) => s.stabilityScore < 30);
  if (veryHighStability.length > 0 && veryLowStability.length > 0) {
    alerts.push({
      id: generateId(),
      type: 'fluctuation',
      level: 'medium',
      message: `方案稳定性差异悬殊（${veryLowStability[0].stabilityScore}~${veryHighStability[0].stabilityScore}），请关注低稳定性方案的实际可行性`,
      timestamp: now,
      dismissed: false,
    });
  }

  return alerts;
}
