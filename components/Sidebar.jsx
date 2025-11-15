'use client';
import { useEffect, useRef } from 'react';
import { examTopics } from '../lib/topics';

export default function Sidebar({
  progress,
  activeTopicId,
  setActiveTopicId,
  isTopicComplete,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  const topicListRef = useRef(null);

  useEffect(() => {
    if (!topicListRef.current || activeTopicId == null) return;
    const active = topicListRef.current.querySelector(`[data-topic-id="${activeTopicId}"]`);
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeTopicId]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="title">
          <span>Gen AI LLMs</span>
          <strong>Study Tracker</strong>
        </div>
        <button
          className="btn sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? '☰' : '✕'}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Progress overview</div>
        <div className="progress-overview">
          <div className="progress-line">
            <div className="progress-bar" style={{ width: progress.percent + '%' }} />
          </div>
          <div className="progress-text">
            {`${progress.complete}/${progress.total} topics complete (${progress.percent}%)`}
          </div>
        </div>
      </div>

      <div className="sidebar-section fill">
        <div className="sidebar-section-label">Topics</div>
        <div className="topic-list" ref={topicListRef}>
          {examTopics.map((t) => (
            <div
              key={t.id}
              data-topic-id={t.id}
              className={
                'topic-item' + (activeTopicId === t.id ? ' active' : '') + (isTopicComplete(t) ? ' complete' : '')
              }
              onClick={() => setActiveTopicId(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActiveTopicId(t.id);
              }}
            >
              <div>
                <div className="topic-item-title">{t.title}</div>
                <div className="topic-item-meta">{t.weight}% weight</div>
              </div>
              <div className="topic-item-meta">{isTopicComplete(t) ? <span className="check">✓</span> : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


