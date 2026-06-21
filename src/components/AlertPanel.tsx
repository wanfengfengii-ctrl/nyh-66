import { useEffect, useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import type { AlertItem, AlertType, AlertLevel } from '@/types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ShieldAlert,
  Activity,
  TrendingDown,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const typeIcons: Record<AlertType, typeof AlertTriangle> = {
  high_risk: ShieldAlert,
  fluctuation: Activity,
  out_of_range: TrendingDown,
};

const typeLabels: Record<AlertType, string> = {
  high_risk: '高风险组合',
  fluctuation: '波动异常',
  out_of_range: '超出稳定区间',
};

const levelStyles: Record<AlertLevel, { bg: string; border: string; text: string; icon: string; dot: string }> = {
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400',
    dot: 'bg-red-400',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  low: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    icon: 'text-sky-400',
    dot: 'bg-sky-400',
  },
};

const levelLabels: Record<AlertLevel, string> = {
  high: '严重',
  medium: '警告',
  low: '提示',
};

export default function AlertPanel() {
  const {
    params,
    playback,
    alerts,
    refreshAlerts,
    dismissAlert,
    clearAlerts,
  } = useYarnStore();

  const metrics = useMemo(() => calculateYarnMetrics(params), [params]);

  useEffect(() => {
    refreshAlerts();
  }, [params, playback.keyframes.length, metrics.breakRisk, metrics.uniformity, metrics.isFeasible, refreshAlerts]);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const highCount = activeAlerts.filter((a) => a.level === 'high').length;
  const mediumCount = activeAlerts.filter((a) => a.level === 'medium').length;
  const lowCount = activeAlerts.filter((a) => a.level === 'low').length;

  const groupedAlerts = useMemo(() => {
    const groups: Record<AlertType, AlertItem[]> = {
      high_risk: [],
      fluctuation: [],
      out_of_range: [],
    };
    activeAlerts.forEach((alert) => {
      groups[alert.type].push(alert);
    });
    return groups;
  }, [activeAlerts]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-5 bg-red-400 rounded-full"></span>
          异常预警
          {activeAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
              {activeAlerts.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={refreshAlerts}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title="刷新检测"
          >
            <RefreshCw size={14} />
          </button>
          {activeAlerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="清除全部"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div className="flex gap-3 mb-4">
          {highCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-400 font-medium">{highCount} 严重</span>
            </div>
          )}
          {mediumCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-medium">{mediumCount} 警告</span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-sky-400 font-medium">{lowCount} 提示</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {(Object.keys(groupedAlerts) as AlertType[]).map((type) => {
          const typeAlerts = groupedAlerts[type];
          if (typeAlerts.length === 0) return null;
          const TypeIcon = typeIcons[type];

          return (
            <div key={type}>
              <div className="flex items-center gap-1.5 mb-2">
                <TypeIcon size={12} className="text-slate-500" />
                <span className="text-xs font-medium text-slate-400">{typeLabels[type]}</span>
                <span className="text-xs text-slate-600">({typeAlerts.length})</span>
              </div>
              <div className="space-y-1.5">
                {typeAlerts.map((alert) => {
                  const styles = levelStyles[alert.level];
                  const LevelIcon = alert.level === 'high' ? AlertTriangle : alert.level === 'medium' ? AlertCircle : Info;

                  return (
                    <div
                      key={alert.id}
                      className={`relative p-3 rounded-xl border ${styles.border} ${styles.bg} transition-all`}
                    >
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="absolute top-2 right-2 p-0.5 text-slate-500 hover:text-white rounded transition-all"
                      >
                        <X size={12} />
                      </button>
                      <div className="flex items-start gap-2 pr-5">
                        <LevelIcon size={14} className={`${styles.icon} mt-0.5 shrink-0`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${styles.text} ${styles.bg}`}>
                              {levelLabels[alert.level]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeAlerts.length === 0 && (
          <div className="text-center py-6">
            <ShieldAlert size={32} className="mx-auto mb-2 text-emerald-500/40" />
            <p className="text-sm text-slate-500">当前无异常预警</p>
            <p className="text-xs text-slate-600 mt-1">所有工艺参数均在安全范围内</p>
          </div>
        )}
      </div>
    </div>
  );
}
