import { useMemo, useRef, useEffect, useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import { TWIST_THRESHOLDS, TWIST_LEVEL_LABELS } from '@/utils/constants';

export default function YarnAnimation() {
  const { params } = useYarnStore();
  const metrics = useMemo(() => calculateYarnMetrics(params), [params]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const speedFactor = params.spindleSpeed / 60;
      setRotation((prev) => prev + delta * 0.1 * speedFactor);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [params.spindleSpeed]);

  const yarnSegments = useMemo(() => {
    const segments = [];
    const twistDensity = metrics.twist / 50;
    const totalSegments = 30;

    for (let i = 0; i < totalSegments; i++) {
      const t = i / (totalSegments - 1);
      const phase = t * twistDensity * Math.PI * 2;
      const amplitude = 8 + Math.sin(phase) * 6;
      segments.push({ t, amplitude, phase });
    }
    return segments;
  }, [metrics.twist]);

  const yarnColor = metrics.breakRisk >= 70
    ? '#ef4444'
    : metrics.twistLevel === 'high'
    ? '#f59e0b'
    : metrics.twistLevel === 'optimal'
    ? '#10b981'
    : '#0ea5e9';

  const twistNorm = Math.min(1, metrics.twist / TWIST_THRESHOLDS.optimalMax);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
        纺纱模拟
      </h2>

      <div className="relative bg-slate-950/50 rounded-xl border border-slate-700/30 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <svg viewBox="0 0 500 280" className="w-full h-auto relative z-10">
          <defs>
            <linearGradient id="yarnGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={yarnColor} stopOpacity="0.6" />
              <stop offset="50%" stopColor={yarnColor} stopOpacity="1" />
              <stop offset="100%" stopColor={yarnColor} stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform="translate(80, 140)">
            <circle r="55" fill="none" stroke="#64748b" strokeWidth="6" opacity="0.3" />
            <circle r="55" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 4" opacity="0.5" />
            <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}>
              <circle r="50" fill="none" stroke="#fbbf24" strokeWidth="2" />
              <line x1="-50" y1="0" x2="50" y2="0" stroke="#fbbf24" strokeWidth="2" />
              <line x1="0" y1="-50" x2="0" y2="50" stroke="#fbbf24" strokeWidth="2" />
              <line x1="-35" y1="-35" x2="35" y2="35" stroke="#fbbf24" strokeWidth="1.5" />
              <line x1="-35" y1="35" x2="35" y2="-35" stroke="#fbbf24" strokeWidth="1.5" />
              <circle r="8" fill="#f59e0b" />
              <circle r="4" fill="#d97706" />
            </g>
            <text y="75" textAnchor="middle" fill="#94a3b8" fontSize="11">纺轮</text>
          </g>

          <g transform="translate(160, 140)">
            <path
              d={`M 0,0 ${yarnSegments.map((s, i) => {
                const x = s.t * 200;
                const y = Math.sin(s.phase + rotation * 0.05) * s.amplitude;
                return `L ${x},${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="url(#yarnGradient)"
              strokeWidth="3"
              filter="url(#glow)"
              strokeLinecap="round"
            />

            {yarnSegments.filter((_, i) => i % 4 === 0).map((s, i) => {
              const x = s.t * 200;
              const y = Math.sin(s.phase + rotation * 0.05) * s.amplitude;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={yarnColor}
                  opacity="0.8"
                />
              );
            })}
          </g>

          <g transform="translate(380, 140)">
            <rect x="-10" y="-40" width="20" height="80" rx="4" fill="#64748b" opacity="0.5" />
            <ellipse cx="0" cy="-45" rx="20" ry="8" fill="#78716c" opacity="0.8" />
            <ellipse cx="0" cy="45" rx="20" ry="8" fill="#78716c" opacity="0.8" />
            <text y="68" textAnchor="middle" fill="#94a3b8" fontSize="11">纱筒</text>
          </g>

          <g transform="translate(420, 140)">
            <rect x="0" y="-50" width="50" height="100" rx="6" fill="#334155" stroke="#475569" />
            <rect x="5" y="-45" width="40" height="90" rx="4" fill="#1e293b" />
            <rect
              x="8"
              y={-40 + (1 - twistNorm) * 70}
              width="34"
              height={twistNorm * 70}
              rx="2"
              fill={yarnColor}
              opacity="0.8"
            />
            <text x="25" y="-55" textAnchor="middle" fill="#94a3b8" fontSize="10">捻度</text>
          </g>

          <g transform="translate(60, 60)">
            <circle cx="0" cy="0" r="15" fill="#fbbf24" opacity="0.2" />
            <circle cx="0" cy="0" r="8" fill="#fbbf24" />
            <text x="25" y="4" fill="#94a3b8" fontSize="10">纤维喂入</text>
          </g>

          <g transform="translate(260, 60)">
            <text textAnchor="middle" fill={yarnColor} fontSize="12" fontWeight="bold">
              {metrics.twist.toFixed(1)} 捻/m
            </text>
            <text y="16" textAnchor="middle" fill="#64748b" fontSize="10">
              {TWIST_LEVEL_LABELS[metrics.twistLevel]}
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>转速: {params.spindleSpeed} rpm</span>
        <span>牵伸: {params.draftSpeed} m/min</span>
        <span>纤维: {params.fiberLength} mm</span>
      </div>
    </div>
  );
}
