import { create } from 'zustand';
import type { YarnParams, Experiment } from '@/types';
import { DEFAULT_PARAMS, STORAGE_KEY } from '@/utils/constants';
import { calculateYarnMetrics, generateId } from '@/utils/calculations';

interface YarnStore {
  params: YarnParams;
  experiments: Experiment[];
  selectedIds: string[];
  setParams: (params: Partial<YarnParams>) => void;
  resetParams: () => void;
  saveExperiment: (name: string) => boolean;
  deleteExperiment: (id: string) => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  loadExperiments: () => void;
}

function loadFromStorage(): Experiment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    console.error('Failed to load experiments from storage');
  }
  return [];
}

function saveToStorage(experiments: Experiment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
  } catch {
    console.error('Failed to save experiments to storage');
  }
}

export const useYarnStore = create<YarnStore>((set, get) => ({
  params: DEFAULT_PARAMS,
  experiments: [],
  selectedIds: [],

  setParams: (newParams) => {
    set((state) => ({
      params: { ...state.params, ...newParams },
    }));
  },

  resetParams: () => {
    set({ params: DEFAULT_PARAMS });
  },

  saveExperiment: (name) => {
    const { params, experiments } = get();
    const metrics = calculateYarnMetrics(params);

    if (!metrics.isFeasible) return false;

    const newExperiment: Experiment = {
      id: generateId(),
      name: name.trim() || `实验 ${experiments.length + 1}`,
      params: { ...params },
      metrics,
      createdAt: Date.now(),
    };

    const updated = [...experiments, newExperiment];
    set({ experiments: updated });
    saveToStorage(updated);
    return true;
  },

  deleteExperiment: (id) => {
    set((state) => {
      const updated = state.experiments.filter((e) => e.id !== id);
      const updatedSelected = state.selectedIds.filter((sid) => sid !== id);
      saveToStorage(updated);
      return { experiments: updated, selectedIds: updatedSelected };
    });
  },

  toggleSelected: (id) => {
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelected: () => {
    set({ selectedIds: [] });
  },

  loadExperiments: () => {
    const experiments = loadFromStorage();
    set({ experiments });
  },
}));
