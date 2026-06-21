import { useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { Play, Trash2, Film, XCircle, Clock, Gauge, Wind, Ruler, Download, Upload } from 'lucide-react';
import type { PlaybackRecord } from '@/types';

export default function PlaybackRecordList() {
  const { playback, loadPlaybackRecord, deletePlaybackRecord, unloadPlaybackRecord } = useYarnStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoad = (record: PlaybackRecord) => {
    if (playback.loadedRecord?.id === record.id) {
      unloadPlaybackRecord();
    } else {
      loadPlaybackRecord(record);
    }
  };

  const handleExport = (record: PlaybackRecord) => {
    const dataStr = JSON.stringify(record, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.name.replace(/\s+/g, '_')}_${record.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const record = JSON.parse(event.target?.result as string) as PlaybackRecord;
        if (record && record.keyframes && record.keyframes.length > 0) {
          loadPlaybackRecord(record);
        }
      } catch (err) {
        console.error('Failed to import playback record:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isLoaded = (id: string) => playback.loadedRecord?.id === id;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
          回放记录
        </h2>
        <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all">
          <Upload size={14} />
          导入
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {playback.savedRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Film size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无保存的回放记录</p>
            <p className="text-xs mt-1">录制完成后点击保存</p>
          </div>
        ) : (
          playback.savedRecords.map((record) => {
            const firstKf = record.keyframes[0];
            const lastKf = record.keyframes[record.keyframes.length - 1];
            const isExpanded = expandedId === record.id;
            const loaded = isLoaded(record.id);

            return (
              <div
                key={record.id}
                className={`group rounded-xl border transition-all ${
                  loaded
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-slate-700/30 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          loaded
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-slate-500 group-hover:border-slate-400'
                        }`}
                      >
                        {loaded && <Play size={10} className="text-white" />}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{record.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{formatDate(record.createdAt)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDuration(record.duration)}
                          </span>
                          <span>·</span>
                          <span>{record.keyframes.length} 帧</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(record);
                        }}
                        className="p-1 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="导出"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaybackRecord(record.id);
                        }}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-2">
                          <div className="text-slate-400 font-medium">起始参数</div>
                          <div className="space-y-1 text-slate-300">
                            <div className="flex items-center gap-1">
                              <Gauge size={10} className="text-teal-400" />
                              <span>{firstKf.params.spindleSpeed} rpm</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wind size={10} className="text-sky-400" />
                              <span>{firstKf.params.draftSpeed} m/min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Ruler size={10} className="text-amber-400" />
                              <span>{firstKf.params.fiberLength} mm</span>
                            </div>
                          </div>
                          <div
                            className="px-2 py-0.5 rounded-full w-fit font-medium"
                            style={{
                              backgroundColor: `${TWIST_LEVEL_COLORS[firstKf.metrics.twistLevel]}20`,
                              color: TWIST_LEVEL_COLORS[firstKf.metrics.twistLevel],
                            }}
                          >
                            {TWIST_LEVEL_LABELS[firstKf.metrics.twistLevel]} · {firstKf.metrics.twist.toFixed(0)} 捻/m
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-slate-400 font-medium">结束参数</div>
                          <div className="space-y-1 text-slate-300">
                            <div className="flex items-center gap-1">
                              <Gauge size={10} className="text-teal-400" />
                              <span>{lastKf.params.spindleSpeed} rpm</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wind size={10} className="text-sky-400" />
                              <span>{lastKf.params.draftSpeed} m/min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Ruler size={10} className="text-amber-400" />
                              <span>{lastKf.params.fiberLength} mm</span>
                            </div>
                          </div>
                          <div
                            className="px-2 py-0.5 rounded-full w-fit font-medium"
                            style={{
                              backgroundColor: `${TWIST_LEVEL_COLORS[lastKf.metrics.twistLevel]}20`,
                              color: TWIST_LEVEL_COLORS[lastKf.metrics.twistLevel],
                            }}
                          >
                            {TWIST_LEVEL_LABELS[lastKf.metrics.twistLevel]} · {lastKf.metrics.twist.toFixed(0)} 捻/m
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoad(record);
                        }}
                        className={`mt-3 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          loaded
                            ? 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        }`}
                        disabled={playback.isRecording || playback.isPlaying}
                      >
                        {loaded ? (
                          <>
                            <XCircle size={14} />
                            卸载回放
                          </>
                        ) : (
                          <>
                            <Play size={14} />
                            加载回放
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {playback.loadedRecord && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">
            已加载 <span className="text-purple-400 font-medium">{playback.loadedRecord.name}</span>，可在工艺回放面板中查看
          </p>
        </div>
      )}
    </div>
  );
}
