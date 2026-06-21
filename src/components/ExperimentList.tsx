import { useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { calculateYarnMetrics } from '@/utils/calculations';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { Plus, Trash2, CheckCircle, XCircle, FlaskConical } from 'lucide-react';

export default function ExperimentList() {
  const { params, experiments, saveExperiment, deleteExperiment, toggleSelected, selectedIds } = useYarnStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const currentMetrics = calculateYarnMetrics(params);

  const handleSave = () => {
    if (!currentMetrics.isFeasible) {
      setError('当前参数方案不可行，无法保存');
      return;
    }
    const success = saveExperiment(name);
    if (success) {
      setName('');
      setError('');
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const twistLabel = (level: string) => TWIST_LEVEL_LABELS[level] || level;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-sky-500 rounded-full"></span>
        实验方案
      </h2>

      <div className="mb-5 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="输入方案名称..."
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
          <button
            onClick={handleSave}
            disabled={!currentMetrics.isFeasible}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
              currentMetrics.isFeasible
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus size={16} />
            保存
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <XCircle size={12} />
            {error}
          </p>
        )}
        {!currentMetrics.isFeasible && !error && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <FlaskConical size={12} />
            请先调整参数至可行范围
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {experiments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无保存的实验方案</p>
            <p className="text-xs mt-1">调整参数后点击保存</p>
          </div>
        ) : (
          experiments.map((exp) => {
            const isSelected = selectedIds.includes(exp.id);
            const color = TWIST_LEVEL_COLORS[exp.metrics.twistLevel];

            return (
              <div
                key={exp.id}
                className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/10 border-teal-500/50'
                    : 'bg-slate-700/30 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
                }`}
                onClick={() => toggleSelected(exp.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-teal-500 border-teal-500'
                          : 'border-slate-500 group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{exp.name}</div>
                      <div className="text-xs text-slate-500">{formatDate(exp.createdAt)}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteExperiment(exp.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-opacity opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {twistLabel(exp.metrics.twistLevel)}
                  </span>
                  <span className="text-slate-400">
                    捻度: <span className="text-slate-300">{exp.metrics.twist.toFixed(1)}</span>
                  </span>
                  <span className="text-slate-400">
                    风险: <span className={exp.metrics.breakRisk > 60 ? 'text-red-400' : 'text-slate-300'}>
                      {exp.metrics.breakRisk}%
                    </span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">
            已选择 <span className="text-teal-400 font-medium">{selectedIds.length}</span> 个方案进行对比
          </p>
        </div>
      )}
    </div>
  );
}
