'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import { examTopics } from '../lib/topics';
import { loadFromLocalStorage, saveToLocalStorage, calculateProgress, createDebounced, scrollToId, nowTs } from '../lib/storage';

export default function Page() {
  const [data, setData] = useState({ topics: {}, lastExport: null });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState(() => (examTopics[0] ? examTopics[0].id : null));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const savingStatusRef = useRef({}); // topicId -> 'idle' | 'saving' | 'saved'
  const debouncersRef = useRef({}); // topicId -> debounced function
  const cloudDebouncerRef = useRef(null); // global debouncer for cloud sync
  const cloudEnabledRef = useRef(true); // disable cloud sync if server not configured

  // Load from localStorage on mount (client), then enable persistence
  useEffect(() => {
    const loaded = loadFromLocalStorage();
    setData(loaded);
    setHasLoaded(true);
    // Attempt to restore from cloud (if configured)
    (async () => {
      try {
        const r = await fetch('/api/notes', { cache: 'no-store' });
        if (r.ok) {
          const remote = await r.json();
          if (remote && remote.topics && typeof remote.topics === 'object') {
            const localCount = Object.keys(loaded.topics || {}).length;
            const remoteCount = Object.keys(remote.topics || {}).length;
            if (remoteCount > localCount) {
              setData(remote);
              saveToLocalStorage(remote);
              return;
            }
          }
        } else if (r.status === 204) {
          cloudEnabledRef.current = false; // no cloud configured
        }
      } catch {}
      // If still empty after cloud attempt, try static seed file committed to repo
      try {
        const hasLocal = Object.keys(loaded.topics || {}).length > 0;
        if (!hasLocal) {
          const seedResp = await fetch('/notes-seed.json', { cache: 'no-store' });
          if (seedResp.ok) {
            const seed = await seedResp.json();
            if (seed && seed.topics && typeof seed.topics === 'object' && Object.keys(seed.topics).length > 0) {
              setData(seed);
              saveToLocalStorage(seed);
            }
          }
        }
      } catch {}
    })();
  }, []);

  // Persist on any change (after initial load)
  useEffect(() => {
    if (!hasLoaded) return;
    saveToLocalStorage(data);
    // Debounced cloud backup (no-op if not configured on server)
    if (!cloudDebouncerRef.current) {
      cloudDebouncerRef.current = createDebounced(2500);
    }
    cloudDebouncerRef.current(async () => {
      if (!cloudEnabledRef.current) return;
      try {
        const resp = await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, data, { lastExport: nowTs() })),
        });
        if (!resp.ok) {
          // Disable further attempts this session to avoid log spam
          cloudEnabledRef.current = false;
        }
      } catch {}
    });
  }, [data, hasLoaded]);

  // Highlight active section while scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const tid = Number(entry.target.getAttribute('data-topicid'));
            setActiveTopicId(tid);
            break;
          }
        }
      },
      { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    const sections = document.querySelectorAll('.topic-section');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Ctrl/Cmd+S to save current topic notes
  useEffect(() => {
    function onKeydown(e) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const accel = isMac ? e.metaKey : e.ctrlKey;
      if (accel && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeTopicId != null) {
          forceSaveNotes(activeTopicId);
        }
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [activeTopicId, data]);

  const progress = useMemo(() => calculateProgress(data), [data]);

  function getTopicState(topicId) {
    const key = String(topicId);
    if (!data.topics[key]) return { readingsComplete: [], notes: '', lastModified: null, readingCompletedAt: {}, readingNotes: {}, readingUserNotes: {}, subtopicSummaries: {}, subtopicStudyGuides: {} };
    const {
      readingsComplete = [],
      notes = '',
      lastModified = null,
      readingCompletedAt = {},
      readingNotes = {},
      readingUserNotes = {},
      subtopicSummaries = {},
      subtopicStudyGuides = {},
    } = data.topics[key];
    return { readingsComplete, notes, lastModified, readingCompletedAt, readingNotes, readingUserNotes, subtopicSummaries, subtopicStudyGuides };
  }

  function updateTopicState(topicId, updater) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const key = String(topicId);
      if (!next.topics[key]) next.topics[key] = { readingsComplete: [], notes: '', lastModified: null };
      updater(next.topics[key]);
      next.topics[key].lastModified = nowTs();
      return next;
    });
  }

  function isTopicComplete(topic) {
    const st = getTopicState(topic.id);
    const num = (topic.readings || []).length;
    return num > 0 && st.readingsComplete.length === num;
  }

  function toggleReadingComplete(topicId, readingIndex) {
    updateTopicState(topicId, (t) => {
      const idx = t.readingsComplete.indexOf(readingIndex);
      if (idx >= 0) {
        // Uncheck: remove from completed and clear completion date and snapshot
        t.readingsComplete.splice(idx, 1);
        if (t.readingCompletedAt) delete t.readingCompletedAt[readingIndex];
        if (t.readingNotes) delete t.readingNotes[readingIndex];
      } else {
        // Check: add to completed, set date and snapshot current topic notes
        t.readingsComplete.push(readingIndex);
        if (!t.readingCompletedAt) t.readingCompletedAt = {};
        if (!t.readingNotes) t.readingNotes = {};
        if (!t.readingUserNotes) t.readingUserNotes = {};
        t.readingCompletedAt[readingIndex] = nowTs();
        t.readingNotes[readingIndex] = t.readingUserNotes[readingIndex] ?? t.notes ?? '';
      }
      t.readingsComplete.sort((a, b) => a - b);
    });
  }

  function updateReadingNotes(topicId, readingIndex, html) {
    updateTopicState(topicId, (t) => {
      if (!t.readingUserNotes) t.readingUserNotes = {};
      t.readingUserNotes[readingIndex] = html;
    });
  }

  function ensureDebouncer(topicId) {
    const key = String(topicId);
    if (!debouncersRef.current[key]) debouncersRef.current[key] = createDebounced(2000);
    return debouncersRef.current[key];
  }

  function setSavingStatus(topicId, status) {
    savingStatusRef.current[String(topicId)] = status;
    setData((prev) => Object.assign({}, prev));
  }

  function updateNotes(topicId, notes) {
    updateTopicState(topicId, (t) => { t.notes = notes; });
    setSavingStatus(topicId, 'saving');
    const debouncer = ensureDebouncer(topicId);
    debouncer(() => { setSavingStatus(topicId, 'saved'); });
  }

  function forceSaveNotes(topicId) { setSavingStatus(topicId, 'saved'); }

  function updateSubtopicSummary(topicId, subIndex, html) {
    updateTopicState(topicId, (t) => {
      if (!t.subtopicSummaries) t.subtopicSummaries = {};
      t.subtopicSummaries[subIndex] = html;
    });
  }

  function updateSubtopicStudyGuide(topicId, subIndex, html) {
    updateTopicState(topicId, (t) => {
      if (!t.subtopicStudyGuides) t.subtopicStudyGuides = {};
      t.subtopicStudyGuides[subIndex] = html;
    });
  }

  // Removed Import/Export functionality per requirements

  function clearAllData() {
    const ok = window.confirm('Clear all saved progress and notes? This cannot be undone.');
    if (!ok) return;
    const empty = { topics: {}, lastExport: null };
    setData(empty);
    saveToLocalStorage(empty);
  }

  function exportAll() {
    try {
      const payload = JSON.stringify(data, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = URL.createObjectURL(blob);
      a.download = `nvda-llm-study-notes-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (_) {
      alert('Export failed.');
    }
  }

  function openImport() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed || typeof parsed !== 'object' || typeof parsed.topics !== 'object') {
          alert('Invalid file format.');
          return;
        }
        setData(parsed);
        saveToLocalStorage(parsed);
        alert('Import successful.');
      } catch {
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
  }

  const appClass = sidebarCollapsed ? 'app sidebar-collapsed' : 'app';

  if (!hasLoaded) {
    // Avoid hydration mismatches and accidental overwrite of existing local data
    return null;
  }

  return (
    <div className={appClass}>
      <Sidebar
        progress={progress}
        activeTopicId={activeTopicId}
        setActiveTopicId={(id) => { setActiveTopicId(id); scrollToId(`topic-${id}`); }}
        isTopicComplete={isTopicComplete}
        onClear={clearAllData}
        onExport={exportAll}
        onImport={openImport}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <input type="file" ref={fileInputRef} accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
      <MainContent
        topics={examTopics}
        getTopicState={getTopicState}
        toggleReadingComplete={toggleReadingComplete}
        updateNotes={updateNotes}
        updateReadingNotes={updateReadingNotes}
        forceSaveNotes={forceSaveNotes}
        savingStatusRef={savingStatusRef}
        updateSubtopicSummary={updateSubtopicSummary}
        updateSubtopicStudyGuide={updateSubtopicStudyGuide}
      />
      {/* Import/Export removed */}
    </div>
  );
}


