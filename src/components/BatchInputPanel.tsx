import { useState, useMemo } from 'react';
import { useYarnStore } from '@/store/useStore';
import { PARAM_RANGES, BREAK_RISK_THRESHOLD, FEASIBLE_UNIFORMITY_MIN } from '@/utils/constants';
import { calculateYarnMetrics } from '@/utils/calculations';
import type { YarnParams } from '@/types';
import { Plus, FolderPlus, Trash2, Upload, Play, Target, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface BatchParamRow {
  id: string;
  params: YarnParams;
}

function createRow(params?: Partial<YarnParams>): BatchParamRow {
  const p = params || {};
  return {
    id: Math.random().toString(36).substr(2, 9),
    params: {
      spindleSpeed: p.spindleSpeed ?? PARAM_RANGES.spindleSpeed.default,
      draftSpeed: p.draftSpeed ?? PARAM_RANGES.draftSpeed.default,
      fiberLength: p.fiberLength ?? PARAM_RANGES.fiberLength.default,
    },
  };
}

export default function BatchInputPanel() {
  const {
    params,
    batches,
    activeBatchId,
    batchTargetSpecs,
    experiments,
    createBatch,
    setActiveBatch,
    deleteBatch,
    addSampleToBatch,
    addSamplesToBatch,
    setBatchTargetSpecs,
    getActiveBatch,
  } = useYarnStore();

  const activeBatch = getActiveBatch();
  const [rows, setRows] = useState<BatchParamRow[]>([createRow()]);
  const [newBatchName, setNewBatchName] = useState('');
  const [showTargetSpecs, setShowTargetSpecs] = useState(false);

  const previewMetrics = useMemo(() => {
    return rows.map((row) => calculateYarnMetrics(row.params));
  }, [rows]);

  const updateRowParam = (rowId: string, key: keyof YarnParams, value: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, params: { ...r.params, [key]: value } } : r
      )
    );
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows((prev) => [...prev, createRow(lastRow?.params)]);
  };

  const addMultipleRows = (count: number) => {
    const lastRow = rows[rows.length - 1];
    const newRows: BatchParamRow[] = [];
    for (let i = 0; i < count; i++) {
      const baseParams: Partial<YarnParams> = lastRow?.params || {};
      newRows.push(createRow({
        spindleSpeed: (baseParams.spindleSpeed ?? PARAM_RANGES.spindleSpeed.default) + (i + 1) * 10,
        draftSpeed: baseParams.draftSpeed,
        fiberLength: baseParams.fiberLength,
      }));
    }
    setRows((prev) => [...prev, ...newRows]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const addCurrentParams = () => {
    setRows((prev) => [...prev, createRow(params)]);
  };

  const importFromExperiments = () => {
    const expParams = experiments.slice(0, 5).map((e) => createRow(e.params));
    if (expParams.length > 0) {
      setRows((prev) => [...prev, ...expParams]);
    }
  };

  const clearRows = () => {
    setRows([createRow()]);
  };

  const handleCreateBatch = () => {
    const batch = createBatch(newBatchName);
    setNewBatchName('');
    if (rows.length > 0) {
      const paramsList = rows.map((r) => r.params);
      addSamplesToBatch(batch.id, paramsList);
    }
  };

  const handleAddToActiveBatch = () => {
    if (!activeBatchId) return;
    const paramsList = rows.map((r) => r.params);
    addSamplesToBatch(activeBatchId, paramsList);
    clearRows();
  };

  const handleAddSingleToBatch = (rowId: string) => {
    if (!activeBatchId) return;
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      addSampleToBatch(activeBatchId, row.params);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
        <Layers className="w-5 h-5 text-purple-400" />
        批次参数录入
      </h2>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-400 mb-1">选择批次</label>
            <select
              value={activeBatchId || ''}
              onChange={(e) => setActiveBatch(e.target.value || null)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">-- 请选择或创建批次 --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.samples.length} 样本)
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-slate-400 mb-1">新建批次名</label>
            <input
              type="text"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              placeholder="输入批次名称"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleCreateBatch}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              创建批次
            </button>
            {activeBatchId && (
              <button
                onClick={() => deleteBatch(activeBatchId)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 text-sm rounded-lg transition-colors border border-red-700/50"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowTargetSpecs(!showTargetSpecs)}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-2"
          >
            <Target className="w-4 h-4 text-amber-400" />
            批次目标规格
            {showTargetSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showTargetSpecs && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-700/50">
              <div>
                <label className="block text-xs text-slate-400 mb-1">目标捻度 (捻/m)</label>
                <input
                  type="number"
                  value={batchTargetSpecs.targetTwist ?? ''}
                  onChange={(e) => setBatchTargetSpecs({ targetTwist: Number(e.target.value) || undefined })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">最大断线风险 (%)</label>
                <input
                  type="number"
                  value={batchTargetSpecs.maxBreakRisk ?? ''}
                  onChange={(e) => setBatchTargetSpecs({ maxBreakRisk: Number(e.target.value) || undefined })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder={String(BREAK_RISK_THRESHOLD - 10)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">最低均匀度 (分)</label>
                <input
                  type="number"
                  value={batchTargetSpecs.minUniformity ?? ''}
                  onChange={(e) => setBatchTargetSpecs({ minUniformity: Number(e.target.value) || undefined })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder={String(FEASIBLE_UNIFORMITY_MIN + 20)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addCurrentParams}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/40 hover:bg-teal-800/50 text-teal-300 text-xs rounded-lg transition-colors border border-teal-700/40"
          >
            <Plus className="w-3.5 h-3.5" />
            使用当前参数
          </button>
          <button
            onClick={() => addRow()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-xs rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新增一行
          </button>
          <button
            onClick={() => addMultipleRows(5)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-xs rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            批量+5行
          </button>
          <button
            onClick={importFromExperiments}
            disabled={experiments.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-xs rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" />
            从实验导入
          </button>
          <button
            onClick={clearRows}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/30 hover:bg-slate-600/30 text-slate-400 text-xs rounded-lg transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        </div>

        <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2">
          {rows.map((row, idx) => {
            const metrics = previewMetrics[idx];
            const isFeasible = metrics.isFeasible;
            return (
              <div
                key={row.id}
                className={`p-3 rounded-xl border transition-all ${
                  isFeasible
                    ? 'bg-slate-950/40 border-slate-700/50 hover:border-purple-500/40'
                    : 'bg-red-950/20 border-red-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">#{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      metrics.twistLevel === 'optimal' ? 'bg-emerald-500/20 text-emerald-400' :
                      metrics.twistLevel === 'low' ? 'bg-sky-500/20 text-sky-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {metrics.twist.toFixed(0)} 捻/m
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      metrics.breakRisk >= 70 ? 'bg-red-500/20 text-red-400' :
                      metrics.breakRisk >= 40 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      风险 {metrics.breakRisk}%
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      metrics.uniformity >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                      metrics.uniformity >= 50 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {metrics.uniformity}分
                    </span>
                    {activeBatchId && (
                      <button
                        onClick={() => handleAddSingleToBatch(row.id)}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        title="添加到批次"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30"
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      转速 (rpm)
                    </label>
                    <input
                      type="range"
                      min={PARAM_RANGES.spindleSpeed.min}
                      max={PARAM_RANGES.spindleSpeed.max}
                      step={PARAM_RANGES.spindleSpeed.step}
                      value={row.params.spindleSpeed}
                      onChange={(e) => updateRowParam(row.id, 'spindleSpeed', Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <input
                      type="number"
                      min={PARAM_RANGES.spindleSpeed.min}
                      max={PARAM_RANGES.spindleSpeed.max}
                      value={row.params.spindleSpeed}
                      onChange={(e) => updateRowParam(row.id, 'spindleSpeed', Number(e.target.value))}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      牵伸 (m/min)
                    </label>
                    <input
                      type="range"
                      min={PARAM_RANGES.draftSpeed.min}
                      max={PARAM_RANGES.draftSpeed.max}
                      step={PARAM_RANGES.draftSpeed.step}
                      value={row.params.draftSpeed}
                      onChange={(e) => updateRowParam(row.id, 'draftSpeed', Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <input
                      type="number"
                      min={PARAM_RANGES.draftSpeed.min}
                      max={PARAM_RANGES.draftSpeed.max}
                      step={PARAM_RANGES.draftSpeed.step}
                      value={row.params.draftSpeed}
                      onChange={(e) => updateRowParam(row.id, 'draftSpeed', Number(e.target.value))}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      纤维 (mm)
                    </label>
                    <input
                      type="range"
                      min={PARAM_RANGES.fiberLength.min}
                      max={PARAM_RANGES.fiberLength.max}
                      step={PARAM_RANGES.fiberLength.step}
                      value={row.params.fiberLength}
                      onChange={(e) => updateRowParam(row.id, 'fiberLength', Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <input
                      type="number"
                      min={PARAM_RANGES.fiberLength.min}
                      max={PARAM_RANGES.fiberLength.max}
                      value={row.params.fiberLength}
                      onChange={(e) => updateRowParam(row.id, 'fiberLength', Number(e.target.value))}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-700/50">
          <button
            onClick={handleAddToActiveBatch}
            disabled={!activeBatchId || rows.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
          >
            <Play className="w-4 h-4" />
            批量添加到当前批次 ({rows.length} 组)
          </button>
        </div>

        {activeBatch && (
          <div className="text-xs text-slate-400 text-center">
            当前批次「{activeBatch.name}」已有 {activeBatch.samples.length} 个样本
          </div>
        )}
      </div>
    </div>
  );
}
