import { useEffect } from 'react';
import ControlPanel from '@/components/ControlPanel';
import YarnAnimation from '@/components/YarnAnimation';
import MetricCards from '@/components/MetricCards';
import StatusIndicator from '@/components/StatusIndicator';
import ExperimentList from '@/components/ExperimentList';
import CompareChart from '@/components/CompareChart';
import SmartRecommendation from '@/components/SmartRecommendation';
import StableIntervalChart from '@/components/StableIntervalChart';
import TrendChart from '@/components/TrendChart';
import ExportPanel from '@/components/ExportPanel';
import ProcessPlayback from '@/components/ProcessPlayback';
import PlaybackRecordList from '@/components/PlaybackRecordList';
import OptimizationDecisionPanel from '@/components/OptimizationDecisionPanel';
import { useYarnStore } from '@/store/useStore';
import { Layers } from 'lucide-react';

export default function Home() {
  const loadExperiments = useYarnStore((state) => state.loadExperiments);
  const loadPlaybackRecords = useYarnStore((state) => state.loadPlaybackRecords);
  const loadOptimizationRecords = useYarnStore((state) => state.loadOptimizationRecords);

  useEffect(() => {
    loadExperiments();
    loadPlaybackRecords();
    loadOptimizationRecords();
  }, [loadExperiments, loadPlaybackRecords, loadOptimizationRecords]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                纺车捻度模拟器
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                探索传统纺纱工艺 · 智能参数推荐 · 实验趋势分析与报告导出
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ControlPanel />
            <SmartRecommendation />
            <StatusIndicator />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <YarnAnimation />
            <MetricCards />
            <ProcessPlayback />
            <CompareChart />
            <StableIntervalChart />
            <TrendChart />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <OptimizationDecisionPanel />
            <ExperimentList />
            <PlaybackRecordList />
            <ExportPanel />
          </div>
        </div>

        <footer className="mt-10 text-center text-slate-500 text-xs">
          <p>调整参数观察纱线变化 · 工艺回放完整记录实验过程 · 智能推荐优化工艺 · 多目标优化与异常预警 · 保存方案进行对比分析 · 导出实验报告</p>
        </footer>
      </div>
    </div>
  );
}
