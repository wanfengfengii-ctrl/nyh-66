import { useYarnStore } from '@/store/useStore';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ExportPanel() {
  const { experiments, selectedIds, exportReport } = useYarnStore();
  const [copied, setCopied] = useState(false);

  const handleExportTxt = () => {
    const report = exportReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `纺车捻度实验报告_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const header = '序号,名称,捻度状态,转速(rpm),牵伸(m/min),纤维(mm),捻度(捻/m),断线风险(%),均匀度(分),可行性,时间';
    const rows = experiments.map((exp, i) => {
      const d = new Date(exp.createdAt);
      const time = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return `${i + 1},${exp.name},${TWIST_LEVEL_LABELS[exp.metrics.twistLevel]},${exp.params.spindleSpeed},${exp.params.draftSpeed},${exp.params.fiberLength},${exp.metrics.twist.toFixed(1)},${exp.metrics.breakRisk},${exp.metrics.uniformity},${exp.metrics.isFeasible ? '可行' : '不可行'},${time}`;
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `纺车实验数据_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = async () => {
    const report = exportReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-5 bg-rose-400 rounded-full"></span>
        实验报告导出
      </h2>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleExportTxt}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50 transition-all group"
        >
          <div className="p-2 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
            <FileText size={18} className="text-rose-400" />
          </div>
          <span className="text-xs text-slate-300 font-medium">文本报告</span>
        </button>

        <button
          onClick={handleExportCsv}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50 transition-all group"
        >
          <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
            <Download size={18} className="text-emerald-400" />
          </div>
          <span className="text-xs text-slate-300 font-medium">CSV 数据</span>
        </button>

        <button
          onClick={handleCopyReport}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50 transition-all group"
        >
          <div className={`p-2 rounded-lg transition-colors ${copied ? 'bg-teal-500/30' : 'bg-sky-500/20 group-hover:bg-sky-500/30'}`}>
            {copied ? (
              <CheckCircle size={18} className="text-teal-400" />
            ) : (
              <FileText size={18} className="text-sky-400" />
            )}
          </div>
          <span className="text-xs text-slate-300 font-medium">
            {copied ? '已复制' : '复制报告'}
          </span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>实验总数: <span className="text-white font-medium">{experiments.length}</span></span>
          <span>已选对比: <span className="text-teal-400 font-medium">{selectedIds.length}</span></span>
        </div>
        <div className="flex gap-3 mt-2">
          {(['low', 'optimal', 'high'] as const).map((level) => {
            const count = experiments.filter((e) => e.metrics.twistLevel === level).length;
            return (
              <div key={level} className="flex items-center gap-1 text-xs">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TWIST_LEVEL_COLORS[level] }}
                />
                <span style={{ color: TWIST_LEVEL_COLORS[level] }}>
                  {TWIST_LEVEL_LABELS[level]}: {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
