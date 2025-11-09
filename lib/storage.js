import { examTopics } from './topics';

export const STORAGE_KEY = 'nvdaGenAILLMStudyTrackerV1';

export function nowTs() { return Date.now(); }

export function loadFromLocalStorage() {
  if (typeof window === 'undefined') return { topics: {}, lastExport: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { topics: {}, lastExport: null };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { topics: {}, lastExport: null };
    if (!parsed.topics || typeof parsed.topics !== 'object') parsed.topics = {};
    return parsed;
  } catch {
    return { topics: {}, lastExport: null };
  }
}

export function saveToLocalStorage(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function calculateProgress(data) {
  const total = examTopics.length;
  let complete = 0;
  for (const topic of examTopics) {
    const tState = data.topics[String(topic.id)] || { readingsComplete: [] };
    const numReadings = (topic.readings || []).length;
    if (numReadings > 0 && tState.readingsComplete && tState.readingsComplete.length === numReadings) complete += 1;
  }
  const percent = total === 0 ? 0 : Math.round((complete / total) * 100);
  return { total, complete, percent };
}

export function createDebounced(delayMs) {
  let timer = null;
  return function (fn) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, delayMs);
  };
}

export function scrollToId(id) {
  if (typeof window === 'undefined') return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


