import { useEffect, useRef, useState } from 'react';
import { useYarnStore } from '@/store/useStore';
import { PLAYBACK_SPEEDS, TWIST_LEVEL_COLORS, TWIST_LEVEL_LABELS } from '@/utils/constants';
import { calculateYarnMetrics } from '@/utils/calculations';
import {
  Play,
  Pause,
  Square,
  Circle,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
  Save,
  Trash2,
  Clock,
  Gauge,
  Wind,
  Ruler,
  Activity,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function ProcessPlayback() {
  const {
    playback,
    startRecording,
    stopRecording,
    startPlayback,
    pausePlayback,
    stopPlayback,
    seekTo,
    setPlaybackSpeed,
    stepForward,
    stepBackward,
    goToKeyframe,
    clearKeyframes,
    savePlaybackRecord,
    getPlaybackParams,
    getPlaybackMetrics,
  } = useYarnStore();

  const [recordName, setRecordName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const playIntervalRef = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playback.isPlaying && playback.keyframes.length > 0) {
      const startTime = Date.now();
      const startPlaybackTime = playback.currentTime;
      const speed = playback.playbackSpeed;
      const duration = playback.duration;

      playIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) * speed;
        const newTime = startPlaybackTime + elapsed;

        if (newTime >= duration) {
          seekTo(duration);
          pausePlayback();
        } else {
          seekTo(newTime);
        }
      }, 33);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [playback.isPlaying, playback.playbackSpeed, playback.keyframes.length, playback.duration, playback.currentTime, seekTo, pausePlayback]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const msec = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${msec.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || playback.duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    seekTo(percent * playback.duration);
  };

  const handleSave = () => {
    const success = savePlaybackRecord(recordName);
    if (success) {
      setRecordName('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const stateParams = useYarnStore((state) => state.params);
  const playbackParams = (playback.isPlaying || playback.isPaused) ? getPlaybackParams() : null;
  const playbackMetrics = (playback.isPlaying || playback.isPaused) ? getPlaybackMetrics() : null;
  const displayParams = playbackParams || stateParams;
  const displayMetrics = playbackMetrics || calculateYarnMetrics(stateParams);

  const keyChangeFrames = playback.keyframes.filter((kf) => kf.isKeyChange);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
        工艺回放
      </h2>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        {playback.isRecording ? (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all animate-pulse"
          >
            <Square size={16} />
            停止录制
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={playback.isPlaying || playback.isPaused}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg transition-all ${
              playback.isPlaying || playback.isPaused
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
            }`}
          >
            <Circle size={16} className="fill-current" />
            开始录制
          </button>
        )}

        {playback.isPlaying ? (
          <button
            onClick={pausePlayback}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Pause size={16} />
            暂停
          </button>
        ) : (
          <button
            onClick={startPlayback}
            disabled={playback.keyframes.length < 2 || playback.isRecording}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg transition-all ${
              playback.keyframes.length < 2 || playback.isRecording
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            <Play size={16} />
            播放
          </button>
        )}

        <button
          onClick={stopPlayback}
          disabled={playback.keyframes.length === 0 || playback.isRecording}
          className={`p-2 rounded-lg transition-all ${
            playback.keyframes.length === 0 || playback.isRecording
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <Square size={16} />
        </button>

        <button
          onClick={() => seekTo(0)}
          disabled={playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying}
          className={`p-2 rounded-lg transition-all ${
            playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title="跳到开始"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          onClick={stepBackward}
          disabled={playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying}
          className={`p-2 rounded-lg transition-all ${
            playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title="上一关键帧"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={stepForward}
          disabled={playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying}
          className={`p-2 rounded-lg transition-all ${
            playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title="下一关键帧"
        >
          <SkipForward size={16} />
        </button>

        <button
          onClick={() => seekTo(playback.duration)}
          disabled={playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying}
          className={`p-2 rounded-lg transition-all ${
            playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title="跳到结束"
        >
          <ChevronsRight size={16} />
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                playback.playbackSpeed === speed
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative h-12 bg-slate-950/50 rounded-xl border border-slate-700/30 cursor-pointer overflow-hidden group"
        >
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="playbackGrid" width="40" height="100%" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 100%" fill="none" stroke="#475569" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#playbackGrid)" />
            </svg>
          </div>

          {playback.duration > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-600/30 to-purple-500/20 transition-all"
              style={{ width: `${(playback.currentTime / playback.duration) * 100}%` }}
            />
          )}

          {keyChangeFrames.map((kf, idx) => {
            const percent = playback.duration > 0 ? (kf.timestamp / playback.duration) * 100 : 0;
            const color = TWIST_LEVEL_COLORS[kf.metrics.twistLevel];
            return (
              <div
                key={kf.id}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-transform z-10"
                style={{ left: `calc(${percent}% - 6px)`, backgroundColor: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  goToKeyframe(playback.keyframes.indexOf(kf));
                }}
                title={`关键帧 ${idx + 1}: ${TWIST_LEVEL_LABELS[kf.metrics.twistLevel]}`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {TWIST_LEVEL_LABELS[kf.metrics.twistLevel]}
                </div>
              </div>
            );
          })}

          {playback.duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 transition-all"
              style={{ left: `${(playback.currentTime / playback.duration) * 100}%` }}
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span className="font-mono">{formatTime(playback.currentTime)}</span>
          </div>
          <span className="font-mono">{formatTime(playback.duration)}</span>
        </div>
      </div>

      <div className="mb-4 p-4 bg-slate-950/30 rounded-xl border border-slate-700/30">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-purple-400" />
          <span className="text-sm font-medium text-slate-300">当前参数</span>
          {playback.isRecording && (
            <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full animate-pulse">
              录制中
            </span>
          )}
          {(playback.isPlaying || playback.isPaused) && (
            <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              {playback.isPlaying ? '播放中' : '已暂停'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge size={12} className="text-teal-400" />
              <span className="text-xs text-slate-400">转速</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {displayParams.spindleSpeed.toFixed(0)}
              <span className="text-xs text-slate-500 font-normal ml-1">rpm</span>
            </div>
          </div>

          <div className="p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Wind size={12} className="text-sky-400" />
              <span className="text-xs text-slate-400">牵伸</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {displayParams.draftSpeed.toFixed(1)}
              <span className="text-xs text-slate-500 font-normal ml-1">m/min</span>
            </div>
          </div>

          <div className="p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Ruler size={12} className="text-amber-400" />
              <span className="text-xs text-slate-400">纤维</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {displayParams.fiberLength.toFixed(0)}
              <span className="text-xs text-slate-500 font-normal ml-1">mm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={12} style={{ color: TWIST_LEVEL_COLORS[displayMetrics.twistLevel] }} />
              <span className="text-xs text-slate-400">捻度</span>
            </div>
            <div className="text-lg font-bold tabular-nums" style={{ color: TWIST_LEVEL_COLORS[displayMetrics.twistLevel] }}>
              {displayMetrics.twist.toFixed(1)}
              <span className="text-xs text-slate-500 font-normal ml-1">捻/m</span>
            </div>
          </div>

          <div className="p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className={displayMetrics.breakRisk >= 70 ? 'text-red-400' : displayMetrics.breakRisk >= 40 ? 'text-yellow-400' : 'text-emerald-400'} />
              <span className="text-xs text-slate-400">断线风险</span>
            </div>
            <div className={`text-lg font-bold tabular-nums ${displayMetrics.breakRisk >= 70 ? 'text-red-400' : displayMetrics.breakRisk >= 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {displayMetrics.breakRisk}
              <span className="text-xs text-slate-500 font-normal ml-1">%</span>
            </div>
          </div>

          <div className="p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={12} className={displayMetrics.uniformity >= 70 ? 'text-emerald-400' : displayMetrics.uniformity >= 50 ? 'text-yellow-400' : 'text-red-400'} />
              <span className="text-xs text-slate-400">均匀度</span>
            </div>
            <div className={`text-lg font-bold tabular-nums ${displayMetrics.uniformity >= 70 ? 'text-emerald-400' : displayMetrics.uniformity >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {displayMetrics.uniformity}
              <span className="text-xs text-slate-500 font-normal ml-1">分</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={recordName}
          onChange={(e) => setRecordName(e.target.value)}
          placeholder="输入回放名称..."
          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
        <button
          onClick={handleSave}
          disabled={playback.keyframes.length < 2 || playback.isRecording || playback.isPlaying}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
            playback.keyframes.length < 2 || playback.isRecording || playback.isPlaying
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : saveSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
          }`}
        >
          <Save size={16} />
          {saveSuccess ? '已保存' : '保存'}
        </button>
        <button
          onClick={clearKeyframes}
          disabled={playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying}
          className={`p-2 rounded-lg transition-all ${
            playback.keyframes.length === 0 || playback.isRecording || playback.isPlaying
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-red-600/20 text-slate-400 hover:text-red-400'
          }`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>已记录 <span className="text-purple-400 font-medium">{playback.keyframes.length}</span> 个关键帧</span>
        {playback.loadedRecord && (
          <span className="text-slate-400">
            加载: <span className="text-purple-400">{playback.loadedRecord.name}</span>
          </span>
        )}
      </div>
    </div>
  );
}
