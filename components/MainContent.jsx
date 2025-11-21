'use client';
import { useEffect, useMemo, useRef } from 'react';
import TopicSection from './TopicSection';

export default function MainContent({
  topics,
  activeTopicId,
  getTopicState,
  toggleReadingComplete,
  updateReadingNotes,
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
            <p className="eyebrow">Crash course</p>
            <h1>Master Gen AI workflows fast</h1>
            <p className="instructions-lead">
              This workspace guides you through curated Gen AI/LLM topics, hands-on readings, structured notes, and Claude Sonnet 4.5-powered quizzes.
            </p>
          </div>
        </div>
        <ol className="instructions-list">
          <li>
            <strong>Pick a topic.</strong> Use the sidebar to hop between Gen AI domains like optimization, safety, orchestration, and deployment.
          </li>
          <li>
            <strong>Complete the suggested readings.</strong> Open links in a new tab, follow the playbooks, and mark them done to capture timestamps.
          </li>
          <li>
            <strong>Capture structured notes.</strong> Summarize subtopics, jot experiments, or outline study guides directly in the editor that auto-saves for you.
          </li>
          <li>
            <strong>Generate quizzes with Claude.</strong> Toggle 🎯 on the sections you just studied, then hit Generate Questions to have Anthropc Claude Sonnet 4.5 craft targeted practice.
          </li>
        </ol>
      </section>
      {topicToRender ? (
        <TopicSection
          key={topicToRender.id}
          topic={topicToRender}
          getTopicState={getTopicState}
          toggleReadingComplete={toggleReadingComplete}
          updateReadingNotes={updateReadingNotes}
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


