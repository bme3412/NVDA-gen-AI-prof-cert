'use client';
import { examTopics } from '../lib/topics';

export default function Sidebar({
  progress,
  activeTopicId,
  setActiveTopicId,
  isTopicComplete,
  onClear,
  onExport,
  onImport,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="title">NVIDIA Gen AI LLMs
Study Tracker</div>
        <button
          className="btn sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? '☰' : '✕'}
        </button>
      </div>

      <div className="progress-overview">
        <div className="progress-line">
          <div className="progress-bar" style={{ width: progress.percent + '%' }} />
        </div>
        <div className="progress-text">
          {`${progress.complete}/${progress.total} topics complete (${progress.percent}%)`}
        </div>
      </div>

      <div className="sidebar-controls">
        <button className="btn danger" onClick={onClear}>Clear All</button>
        <button className="btn" onClick={onExport} title="Download your notes as JSON">Export</button>
        <button className="btn" onClick={onImport} title="Import notes from JSON">Import</button>
      </div>

      <div className="topic-list">
        {examTopics.map((t) => (
          <div
            key={t.id}
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
    </aside>
  );
}


