'use client';
import TopicSection from './TopicSection';

export default function MainContent({ topics, getTopicState, toggleReadingComplete, updateNotes, updateReadingNotes, forceSaveNotes, savingStatusRef, updateSubtopicSummary, updateSubtopicStudyGuide }) {
  return (
    <main className="main">
      {topics.map((topic) => (
        <TopicSection
          key={topic.id}
          topic={topic}
          getTopicState={getTopicState}
          toggleReadingComplete={toggleReadingComplete}
          updateNotes={updateNotes}
          updateReadingNotes={updateReadingNotes}
          forceSaveNotes={forceSaveNotes}
          savingStatusRef={savingStatusRef}
          updateSubtopicSummary={updateSubtopicSummary}
          updateSubtopicStudyGuide={updateSubtopicStudyGuide}
        />
      ))}
    </main>
  );
}


