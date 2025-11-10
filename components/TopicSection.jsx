'use client';
import { useRef, useState } from 'react';
import { generateQuestionsFromSubtopics } from '../lib/questions';
import RichNotesEditor from './RichNotesEditor';

export default function TopicSection({ topic, getTopicState, toggleReadingComplete, updateNotes, updateReadingNotes, forceSaveNotes, savingStatusRef, updateSubtopicSummary, updateSubtopicStudyGuide }) {
  const { readingsComplete, notes, readingCompletedAt = {}, readingNotes = {}, readingUserNotes = {}, subtopicSummaries = {}, subtopicStudyGuides = {} } = getTopicState(topic.id);
  const savingStatus = (savingStatusRef.current || {})[String(topic.id)] || 'idle';
  const readings = topic.readings || [];
  const allComplete = readings.length > 0 && readingsComplete.length === readings.length;
  const [questions, setQuestions] = useState([]);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [openReadingIdx, setOpenReadingIdx] = useState(null);
  const [qCollapsed, setQCollapsed] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [notesCollapsed, setNotesCollapsed] = useState(false);
  const [openReadingEditorIdx, setOpenReadingEditorIdx] = useState(null);
  const [readingSaveState, setReadingSaveState] = useState({}); // idx -> 'idle'|'saving'|'saved'
  const readingDebouncersRef = useRef({});
  const [openSubtopicIdx, setOpenSubtopicIdx] = useState(null);
  const [subtopicSaveState, setSubtopicSaveState] = useState({}); // keys: `sum-idx` or `guide-idx`
  const subtopicDebouncersRef = useRef({});
  const [mcqSelected, setMcqSelected] = useState({}); // i -> selectedIndex
  const [mcqChecked, setMcqChecked] = useState({}); // i -> true

  function plainTextLength(html) {
    if (!html) return 0;
    const text = String(html)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    return text.length;
  }

  function formatDate(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleDateString(); } catch { return '';
    }
  }

  function ensureReadingDebouncer(idx) {
    if (!readingDebouncersRef.current[idx]) {
      readingDebouncersRef.current[idx] = (function () {
        let t = null;
        return function (fn) {
          if (t) clearTimeout(t);
          t = setTimeout(fn, 2000);
        };
      })();
    }
    return readingDebouncersRef.current[idx];
  }

  function setReadingStatus(idx, status) {
    setReadingSaveState((prev) => ({ ...prev, [idx]: status }));
  }

  function ensureSubtopicDebouncer(key) {
    if (!subtopicDebouncersRef.current[key]) {
      subtopicDebouncersRef.current[key] = (function () {
        let t = null;
        return function (fn) {
          if (t) clearTimeout(t);
          t = setTimeout(fn, 2000);
        };
      })();
    }
    return subtopicDebouncersRef.current[key];
  }

  function setSubtopicStatus(key, status) {
    setSubtopicSaveState((prev) => ({ ...prev, [key]: status }));
  }

  return (
    <section className="topic-section" id={`topic-${topic.id}`} data-topicid={String(topic.id)}>
      <div className="topic-header">
        <div className="topic-title">{topic.title}</div>
        <div className="topic-weight">{allComplete ? 'Complete ✓' : `${topic.weight}% weight`}</div>
      </div>

      <div className="subtopics">
        <strong>Subtopics</strong>
        <ul>
          {(topic.subtopics || []).map((s, i) => (
            <li key={i} id={`subtopic-${topic.id}-${i}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{s}</span>
                <button
                  className="icon-btn"
                  title="Open LLM notes editors for this subtopic"
                  onClick={() => {
                    setOpenSubtopicIdx((cur) => {
                      const next = cur === i ? null : i;
                      // After state update, scroll the opened subtopic into view to avoid awkward layout jumps
                      setTimeout(() => {
                        if (next !== null) {
                          const el = document.getElementById(`subtopic-${topic.id}-${i}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 0);
                      return next;
                    });
                  }}
                >🧠</button>
              </div>
              {openSubtopicIdx === i && (
                <div className="reading-notes" style={{ marginTop: 6 }}>
                  <div className="notes-header">
                    <strong>Summary</strong>
                    <div className="notes-status">
                      {subtopicSaveState[`sum-${i}`] === 'saving'
                        ? 'Saving...'
                        : subtopicSaveState[`sum-${i}`] === 'saved'
                        ? 'Saved'
                        : ''}
                    </div>
                  </div>
                  <RichNotesEditor
                    value={subtopicSummaries[i] || ''}
                    onChange={(html) => {
                      const key = `sum-${i}`;
                      setSubtopicStatus(key, 'saving');
                      updateSubtopicSummary(topic.id, i, html);
                      const deb = ensureSubtopicDebouncer(key);
                      deb(() => setSubtopicStatus(key, 'saved'));
                    }}
                    placeholder="Paste or write the LLM-generated summary here..."
                  />
                  <div className="notes-header" style={{ marginTop: 6 }}>
                    <div className="char-count">{plainTextLength(subtopicSummaries[i])} characters</div>
                    <button className="btn" onClick={() => setSubtopicStatus(`sum-${i}`, 'saved')}>Save Summary</button>
                  </div>

                  <div className="notes-header" style={{ marginTop: 12 }}>
                    <strong>Study Guide</strong>
                    <div className="notes-status">
                      {subtopicSaveState[`guide-${i}`] === 'saving'
                        ? 'Saving...'
                        : subtopicSaveState[`guide-${i}`] === 'saved'
                        ? 'Saved'
                        : ''}
                    </div>
                  </div>
                  <RichNotesEditor
                    value={subtopicStudyGuides[i] || ''}
                    onChange={(html) => {
                      const key = `guide-${i}`;
                      setSubtopicStatus(key, 'saving');
                      updateSubtopicStudyGuide(topic.id, i, html);
                      const deb = ensureSubtopicDebouncer(key);
                      deb(() => setSubtopicStatus(key, 'saved'));
                    }}
                    placeholder="Paste or write the LLM-generated study guide here..."
                  />
                  <div className="notes-header" style={{ marginTop: 6 }}>
                    <div className="char-count">{plainTextLength(subtopicStudyGuides[i])} characters</div>
                    <button className="btn" onClick={() => setSubtopicStatus(`guide-${i}`, 'saved')}>Save Guide</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="readings">
        <h4>Suggested readings</h4>
        {readings.length === 0 ? (
          <div className="progress-text">No readings provided.</div>
        ) : (
          readings.map((r, idx) => (
            <div key={r.url} className="reading-row">
              <input
                type="checkbox"
                checked={readingsComplete.includes(idx)}
                onChange={() => toggleReadingComplete(topic.id, idx)}
              />
              <a
                className="reading-link"
                href={r.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  // Open per-reading notes editor; initialize if not present
                  if (!readingUserNotes[idx]) {
                    updateReadingNotes(topic.id, idx, '');
                  }
                  setOpenReadingEditorIdx(idx);
                }}
              >
                {r.title}
              </a>
              {readingCompletedAt[idx] ? (
                <span className="reading-meta">Completed: {formatDate(readingCompletedAt[idx])}
                  {readingNotes[idx] ? (
                    <button
                      className="icon-btn"
                      title="View saved notes snapshot"
                      onClick={() => setOpenReadingIdx(idx)}
                      style={{ marginLeft: 6 }}
                    >📄</button>
                  ) : null}
                </span>
              ) : null}
              <button
                className="icon-btn"
                style={{ marginLeft: 6 }}
                title="Open notes for this reading"
                onClick={() => {
                  if (!readingUserNotes[idx]) {
                    updateReadingNotes(topic.id, idx, '');
                  }
                  setOpenReadingEditorIdx((cur) => (cur === idx ? null : idx));
                }}
              >📝</button>
            </div>
          ))
        )}
      </div>

      {openReadingEditorIdx !== null && (
        <div className="reading-notes">
          <div className="notes-header">
            <strong>Notes for: {readings[openReadingEditorIdx]?.title}</strong>
            <div className="notes-status">
              {readingSaveState[openReadingEditorIdx] === 'saving'
                ? 'Saving...'
                : readingSaveState[openReadingEditorIdx] === 'saved'
                ? 'Saved'
                : ''}
            </div>
          </div>
          <RichNotesEditor
            value={readingUserNotes[openReadingEditorIdx] || ''}
            onChange={(html) => {
              setReadingStatus(openReadingEditorIdx, 'saving');
              updateReadingNotes(topic.id, openReadingEditorIdx, html);
              const deb = ensureReadingDebouncer(openReadingEditorIdx);
              deb(() => setReadingStatus(openReadingEditorIdx, 'saved'));
            }}
            placeholder="Notes for this reading..."
          />
          <div className="notes-header" style={{ marginTop: 6 }}>
            <div className="char-count">{plainTextLength(readingUserNotes[openReadingEditorIdx])} characters</div>
            <button className="btn" onClick={() => setReadingStatus(openReadingEditorIdx, 'saved')}>Save Notes</button>
          </div>
        </div>
      )}

      <div className="questions">
        <div className="notes-header" style={{ marginTop: 8 }}>
          <strong>Practice Questions</strong>
          <div>
            <button className="btn" style={{ marginRight: 6 }} onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>
            <button className="btn" onClick={() => setQCollapsed((v) => !v)}>
              {qCollapsed ? 'Expand' : 'Minimize'}
            </button>
          </div>
        </div>
        {!qCollapsed && (
        <div style={{ marginTop: 8 }}>
          <button
            className="btn primary"
            disabled={aiLoading}
            onClick={async () => {
              setAiError('');
              setAiLoading(true);
              try {
                // Aggregate notes from topic, subtopics, and readings
                function buildAggregatedNotes() {
                  const parts = [];
                  if (notes && String(notes).trim()) {
                    parts.push('== Topic Notes ==\n' + String(notes).trim());
                  }
                  // Subtopic summaries and study guides
                  const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
                  const subSections = [];
                  subtopics.forEach((label, idx) => {
                    const sum = subtopicSummaries[idx] || '';
                    const guide = subtopicStudyGuides[idx] || '';
                    if ((sum && String(sum).trim()) || (guide && String(guide).trim())) {
                      const lines = [];
                      lines.push(`-- ${label} --`);
                      if (sum && String(sum).trim()) lines.push('Summary:\n' + String(sum).trim());
                      if (guide && String(guide).trim()) lines.push('Study Guide:\n' + String(guide).trim());
                      subSections.push(lines.join('\n'));
                    }
                  });
                  if (subSections.length > 0) {
                    parts.push('== Subtopic Notes ==\n' + subSections.join('\n\n'));
                  }
                  // Reading notes (prefer user notes; fallback to snapshot if available)
                  const readingSections = [];
                  (topic.readings || []).forEach((r, idx) => {
                    const userNote = readingUserNotes[idx] || '';
                    const snap = readingNotes[idx] || '';
                    const chosen = (userNote && String(userNote).trim())
                      ? String(userNote).trim()
                      : (snap && String(snap).trim())
                      ? String(snap).trim()
                      : '';
                    if (chosen) {
                      readingSections.push(`-- ${r.title} --\n` + chosen);
                    }
                  });
                  if (readingSections.length > 0) {
                    parts.push('== Reading Notes ==\n' + readingSections.join('\n\n'));
                  }
                  return parts.join('\n\n').trim();
                }
                const aggregatedNotes = buildAggregatedNotes();
                // Try AI first
                const res = await fetch('/api/generate-questions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    topicTitle: topic.title,
                    subtopics: topic.subtopics || [],
                    notes: aggregatedNotes,
                    count: 12,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  const q = Array.isArray(data.questions) ? data.questions : [];
                  if (q.length > 0) {
                    setAiQuestions(q);
                    setQuestions([]);
                    setMcqSelected({});
                    setMcqChecked({});
                  } else {
                    // Fallback to local if AI returned no questions
                    setAiQuestions([]);
                    setQuestions(generateQuestionsFromSubtopics(topic.subtopics, 10));
                  }
                } else {
                  // Fallback to local on error
                  setAiQuestions([]);
                  setQuestions(generateQuestionsFromSubtopics(topic.subtopics, 10));
                }
              } catch (_) {
                // Fallback to local on exception
                setAiQuestions([]);
                setQuestions(generateQuestionsFromSubtopics(topic.subtopics, 10));
              } finally {
                setAiLoading(false);
              }
            }}
          >
            {aiLoading ? 'Generating...' : ((aiQuestions.length || questions.length) ? 'Regenerate Questions' : 'Generate Questions')}
          </button>
        </div>
        )}
        {!qCollapsed && aiError && <div className="progress-text" style={{ color: '#b91c1c', marginTop: 8 }}>{aiError}</div>}
        {!qCollapsed && (aiQuestions.length > 0 ? (
          <div className="ai-questions" style={{ marginTop: 10 }}>
            <ul className="question-list">
              {aiQuestions.map((q, i) => {
                const selected = mcqSelected[i];
                const checked = mcqChecked[i] === true;
                const correct = Number.isInteger(q.correctIndex) ? q.correctIndex : -1;
                return (
                  <li key={i} className="question-item mcq-card">
                    <div className="mcq-stem"><strong>Q{i + 1}.</strong> {q.question}</div>
                    <div className="mcq-options">
                      {(q.choices || []).map((c, j) => {
                        const isSelected = selected === j;
                        const isCorrect = checked && j === correct;
                        const isWrong = checked && isSelected && j !== correct;
                        const cls =
                          'mcq-option' +
                          (isCorrect ? ' correct' : '') +
                          (isWrong ? ' wrong' : '') +
                          (!isCorrect && !isWrong && isSelected ? ' selected' : '');
                        return (
                          <button
                            key={j}
                            type="button"
                            className={cls}
                            onClick={() => setMcqSelected((prev) => ({ ...prev, [i]: j }))}
                          >
                            {String.fromCharCode(65 + j)}. {c}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mcq-actions">
                      <button
                        className="btn"
                        onClick={() => setMcqChecked((prev) => ({ ...prev, [i]: true }))}
                        disabled={checked || typeof selected !== 'number'}
                      >
                        {checked ? 'Checked' : 'Check'}
                      </button>
                      {checked && correct >= 0 && (
                        <span className={'mcq-result ' + (selected === correct ? 'ok' : 'bad')}>
                          {selected === correct ? 'Correct!' : `Incorrect. Correct answer: ${String.fromCharCode(65 + correct)}.`}
                        </span>
                      )}
                    </div>
                    {checked && q.explanation ? (
                      <div className="mcq-expl">
                        <strong>Why:</strong> <span>{q.explanation}</span>
                      </div>
                    ) : null}
                    {showAnswers && correct >= 0 && (
                      <div className="mcq-expl">
                        <strong>Answer:</strong> {String.fromCharCode(65 + correct)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (questions.length > 0 && (
          <ul className="question-list">
            {questions.map((q, i) => (
              <li key={i} className="question-item">{q}</li>
            ))}
          </ul>
        )))}
      </div>

      <div className="notes">
        <div className="notes-header">
          <strong>Notes</strong>
          <div className="notes-status">
            {savingStatus === 'saving' ? 'Saving...' : savingStatus === 'saved' ? 'Saved' : ''}
            <button className="btn" style={{ marginLeft: 8 }} onClick={() => setNotesCollapsed((v) => !v)}>
              {notesCollapsed ? 'Expand' : 'Minimize'}
            </button>
          </div>
        </div>
        {!notesCollapsed && (
          <>
            <RichNotesEditor
              value={notes || ''}
              onChange={(html) => updateNotes(topic.id, html)}
              placeholder="Type your notes here..."
            />
            <div className="notes-header" style={{ marginTop: 6 }}>
              <div className="char-count">{plainTextLength(notes)} characters</div>
              <button className="btn" onClick={() => forceSaveNotes(topic.id)}>Save Notes</button>
            </div>
          </>
        )}
      </div>

      {openReadingIdx !== null && (
        <div className="modal-overlay" onClick={() => setOpenReadingIdx(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Notes snapshot</strong>
              <button className="btn" onClick={() => setOpenReadingIdx(null)}>Close</button>
            </div>
            <div className="modal-body">
              {readingNotes[openReadingIdx] ? (
                <div dangerouslySetInnerHTML={{ __html: readingNotes[openReadingIdx] }} />
              ) : (
                <div className="progress-text">No notes were saved when this reading was marked complete.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


