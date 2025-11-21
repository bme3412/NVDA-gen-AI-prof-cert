'use client';
import { useEffect, useMemo, useRef } from 'react';
import TopicSection from './TopicSection';

export default function MainContent({
  topics,
  activeTopicId,
  getTopicState,
  toggleReadingComplete,
  updateNotes,
  updateReadingNotes,
  forceSaveNotes,
  savingStatusRef,
  updateSubtopicSummary,
  updateSubtopicStudyGuide,
}) {
  const mainRef = useRef(null);

  const topicToRender = useMemo(() => {
    if (!Array.isArray(topics)) return null;
    if (topics.length === 0) return null;
    if (activeTopicId == null) return topics[0];
    return topics.find((t) => t.id === activeTopicId) || topics[0];
  }, [topics, activeTopicId]);

  useEffect(() => {
    if (!mainRef.current) return;
    mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [topicToRender?.id]);

  return (
    <main className="main" ref={mainRef}>
      <section className="instructions-card">
        <div className="instructions-card-header">
          <div>
            <p className="eyebrow">Quick start</p>
            <h1>How to use this tracker</h1>
            <p className="instructions-lead">
              Everything you write saves instantly to your browser, and if cloud sync is turned on it mirrors the newest version everywhere else.
            </p>
          </div>
          <div className="instructions-actions">
            <div className="chip">No data leaves your device unless you enable sync.</div>
          </div>
        </div>
        <ol className="instructions-list">
          <li>
            <strong>Pick a topic.</strong> Use the sidebar to hop between sections; the reading pane jumps back to the top automatically.
          </li>
          <li>
            <strong>Read through the material.</strong> Follow the built-in links, take your time, and check items off to log when you finished plus any quick takeaways.
          </li>
          <li>
            <strong>Capture your notes.</strong> Jot highlights, subtopic snapshots, or mini study guides in the rich editor—no save button needed.
          </li>
          <li>
            <strong>Drill with questions.</strong> Tap the target icon beside any topic or reading to generate new questions tailored to that exact section.
          </li>
          <li>
            <strong>Share updates.</strong> When you redeploy, push both the cloud copy and `notes-seed.json` so every browser loads the newest content.
          </li>
        </ol>
      </section>
      {topicToRender ? (
        <TopicSection
          key={topicToRender.id}
          topic={topicToRender}
          getTopicState={getTopicState}
          toggleReadingComplete={toggleReadingComplete}
          updateNotes={updateNotes}
          updateReadingNotes={updateReadingNotes}
          forceSaveNotes={forceSaveNotes}
          savingStatusRef={savingStatusRef}
          updateSubtopicSummary={updateSubtopicSummary}
          updateSubtopicStudyGuide={updateSubtopicStudyGuide}
        />
      ) : (
        <div className="empty-state">
          <strong>Select a topic to begin</strong>
          <p>Choose anything from the sidebar to start reviewing content and managing notes.</p>
        </div>
      )}
    </main>
  );
}


