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


