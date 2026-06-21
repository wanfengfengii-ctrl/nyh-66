import type { YarnParams, YarnMetrics, TwistLevel } from '@/types';
import {
  TWIST_THRESHOLDS,
  BREAK_RISK_THRESHOLD,
  FEASIBLE_UNIFORMITY_MIN,
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
