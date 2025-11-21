'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import { examTopics } from '../lib/topics';
import { loadFromLocalStorage, saveToLocalStorage, calculateProgress, createDebounced, nowTs } from '../lib/storage';

export default function Page() {
  const [data, setData] = useState({ topics: {}, lastExport: null });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState(() => (examTopics[0] ? examTopics[0].id : null));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        let remote = null;
        if (r.ok) {
          remote = await r.json();
        } else if (r.status === 204) {
          cloudEnabledRef.current = false; // no cloud configured
        }
      } catch {}
      // Load seed file (if present)
      let seed = null;
      try {
        const seedResp = await fetch('/notes-seed.json', { cache: 'no-store' });
        if (seedResp.ok) seed = await seedResp.json();
      } catch {}
      // Choose the best dataset among local, remote, seed
      const score = (d) => {
        try {
          const ts = typeof d?.lastExport === 'number' ? d.lastExport : 0;
          const cnt = Object.keys(d?.topics || {}).length;
          return ts || cnt ? ts * 1 + cnt : 0;
        } catch { return 0; }
      };
      const candidates = [
        { key: 'local', data: loaded },
        { key: 'remote', data: typeof remote === 'object' ? remote : null },
        { key: 'seed', data: typeof seed === 'object' ? seed : null },
      ].filter((c) => c.data && (Object.keys(c.data.topics || {}).length > 0));
      if (candidates.length > 0) {
        candidates.sort((a, b) => score(b.data) - score(a.data));
        const best = candidates[0];
        // If best is not the already loaded local, adopt it
        const isSame =
          best.key === 'local' ||
          JSON.stringify(best.data?.topics || {}) === JSON.stringify(loaded?.topics || {});
        if (!isSame) {
          setData(best.data);
          saveToLocalStorage(best.data);
          // If the best is seed and cloud is enabled, push it to cloud once
          if (best.key === 'seed' && cloudEnabledRef.current) {
            try {
              await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({}, best.data, { lastExport: nowTs() })),
              });
            } catch {}
          }
        }
      }
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
      next.lastExport = nowTs();
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
        setActiveTopicId={setActiveTopicId}
        isTopicComplete={isTopicComplete}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <MainContent
        topics={examTopics}
        activeTopicId={activeTopicId}
        getTopicState={getTopicState}
        toggleReadingComplete={toggleReadingComplete}
        updateReadingNotes={updateReadingNotes}
        updateSubtopicSummary={updateSubtopicSummary}
        updateSubtopicStudyGuide={updateSubtopicStudyGuide}
      />
      {/* Import/Export removed */}
    </div>
  );
}


