'use client';
import { useRef, useState, useEffect } from 'react';
import { generateQuestionsFromSubtopics } from '../lib/questions';
import RichNotesEditor from './RichNotesEditor';

const MAX_QUIZ_QUESTIONS = 10;

export default function TopicSection({ topic, getTopicState, toggleReadingComplete, updateReadingNotes, updateSubtopicSummary, updateSubtopicStudyGuide }) {
  const { readingsComplete, notes, readingCompletedAt = {}, readingNotes = {}, readingUserNotes = {}, subtopicSummaries = {}, subtopicStudyGuides = {} } = getTopicState(topic.id);
  const readings = topic.readings || [];
  const allComplete = readings.length > 0 && readingsComplete.length === readings.length;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [openReadingIdx, setOpenReadingIdx] = useState(null);
  const [openReadingEditorIdx, setOpenReadingEditorIdx] = useState(null);
  const [readingSaveState, setReadingSaveState] = useState({}); // idx -> 'idle'|'saving'|'saved'
  const readingDebouncersRef = useRef({});
  const [openSubtopicIdx, setOpenSubtopicIdx] = useState(null);
  const [subtopicSaveState, setSubtopicSaveState] = useState({}); // keys: `sum-idx` or `guide-idx`
  const subtopicDebouncersRef = useRef({});
  const [readingIncluded, setReadingIncluded] = useState({}); // idx -> boolean
  const [subtopicsIncluded, setSubtopicsIncluded] = useState({}); // idx -> boolean
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelections, setQuizSelections] = useState({});
  const [quizCheckedState, setQuizCheckedState] = useState({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizShowExplanation, setQuizShowExplanation] = useState(false);
  const [quizReviewOpen, setQuizReviewOpen] = useState(false);

  // Initialize reading include selections to all false (once)
  useEffect(() => {
    if (!Array.isArray(readings)) return;
    const keys = Object.keys(readingIncluded);
    if (keys.length === 0 && readings.length > 0) {
      const none = {};
      readings.forEach((_, idx) => { none[idx] = false; });
      setReadingIncluded(none);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings?.length]);

  useEffect(() => {
    const subs = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    setSubtopicsIncluded((prev) => {
      const next = {};
      let changed = false;
      subs.forEach((_, idx) => {
        const val = typeof prev[idx] === 'boolean' ? prev[idx] : false;
        next[idx] = val;
        if (prev[idx] !== val) changed = true;
      });
      Object.keys(prev || {}).forEach((key) => {
        const idx = Number(key);
        if (!Number.isNaN(idx) && idx >= subs.length) {
          changed = true;
        }
      });
      if (!changed) return prev;
      return next;
    });
  }, [topic.subtopics]);

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

  function decodeHtmlEntities(str) {
    return String(str || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#160;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

  function extractNoteLines(html, limit = 2) {
    if (!html) return [];
    let text = decodeHtmlEntities(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '');
    text = text
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!text) return [];
    const segments = text.split('\n').filter(Boolean);
    const lines = [];
    for (const segment of segments) {
      const withBreaks = segment.replace(/([.!?])\s+/g, '$1|');
      const candidates = withBreaks
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      const source = candidates.length > 0 ? candidates : [segment.trim()];
      for (const sentence of source) {
        if (!sentence) continue;
        lines.push(sentence);
        if (lines.length >= limit) return lines;
      }
    }
    return lines;
  }

  function normalizeWhitespace(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function clampText(value, limit) {
    const text = normalizeWhitespace(value);
    if (!text) return '';
    if (!limit || text.length <= limit) return text;
    return `${text.slice(0, Math.max(limit - 3, 0)).trim()}...`;
  }

  function ensureStemEnding(text) {
    if (!text) return '';
    if (/[.!?]$/.test(text)) return text;
    return `${text}?`;
  }

  function shuffleChoicesStable(options, seedBase = 1) {
    const out = [...options];
    let seed = (seedBase + 1) * 9973;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function sanitizeQuestionSet(questionSet) {
    const seedBase = Date.now();
    const CHOICE_MAX = 170;
    const STEM_MAX = 200;
    const EXPL_MAX = 240;
    return (questionSet || [])
      .map((question, idx) => {
        const normalizedChoices = Array.isArray(question.choices)
          ? question.choices.map((choice, choiceIdx) => ({
              text: clampText(choice, CHOICE_MAX),
              isCorrect: choiceIdx === question.correctIndex,
            }))
          : [];
        const filteredChoices = normalizedChoices.filter((entry) => entry.text);
        if (filteredChoices.length !== 4) return null;
        const shuffled = shuffleChoicesStable(filteredChoices, seedBase + idx);
        const correctIndex = shuffled.findIndex((entry) => entry.isCorrect);
        if (correctIndex < 0) return null;
        return {
          question: ensureStemEnding(clampText(question.question, STEM_MAX)),
          choices: shuffled.map((entry) => entry.text),
          correctIndex,
          explanation: clampText(question.explanation, EXPL_MAX),
        };
      })
      .filter(Boolean);
  }

  function getIncludedSubtopicIndexes({ strict = false } = {}) {
    const labels = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    const selected = labels
      .map((_, idx) => (subtopicsIncluded[idx] ? idx : null))
      .filter((idx) => idx !== null);
    return selected;
  }

  function getIncludedReadingIndexes() {
    const items = Array.isArray(readings) ? readings : [];
    return items
      .map((_, idx) => (readingIncluded[idx] ? idx : null))
      .filter((idx) => idx !== null);
  }

  function buildSubtopicQuestionSeeds(indexes) {
    const labels = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    const seeds = [];
    indexes
      .filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => a - b)
      .forEach((idx) => {
        const label = String(labels[idx] || '').trim() || `Subtopic ${idx + 1}`;
        const summaryLines = extractNoteLines(subtopicSummaries[idx], 2);
        const guideLines = extractNoteLines(subtopicStudyGuides[idx], 2);
        const pushSeed = (fact, detailType) => {
          const trimmed = String(fact || '').trim();
          if (!trimmed) return;
          seeds.push({ label, fact: trimmed, detailType });
        };
        summaryLines.forEach((line) => pushSeed(line, 'summary'));
        guideLines.forEach((line) => pushSeed(line, 'guide'));
        if (summaryLines.length === 0 && guideLines.length === 0) {
          pushSeed(`Focus on ${label} and how it applies to Gen AI workloads.`, 'label');
        } else {
          pushSeed(`Ensure mastery of ${label} so it can be applied during the exam.`, 'label');
        }
      });
    return seeds;
  }

  function buildReadingQuestionSeeds(indexes) {
    const seeds = [];
    indexes
      .filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => a - b)
      .forEach((idx) => {
        const reading = readings[idx] || {};
        const label = String(reading.title || `Reading ${idx + 1}`).trim() || `Reading ${idx + 1}`;
        const sourceHtml = (() => {
          const user = readingUserNotes[idx];
          if (user && String(user).trim()) return String(user);
          const snap = readingNotes[idx];
          if (snap && String(snap).trim()) return String(snap);
          return '';
        })();
        const lines = extractNoteLines(sourceHtml, 3);
        const pushSeed = (fact) => {
          const trimmed = String(fact || '').trim();
          if (!trimmed) return;
          seeds.push({ label, fact: trimmed, detailType: 'reading' });
        };
        if (lines.length > 0) {
          lines.forEach((line) => pushSeed(line));
        } else {
          pushSeed(`Review ${label} and apply its recommendations to Gen AI workloads.`);
        }
      });
    return seeds;
  }

  function beginQuizGeneration() {
    setQuizModalOpen(true);
    setQuizLoading(true);
    setQuizReviewOpen(false);
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizSelections({});
    setQuizCheckedState({});
    setQuizComplete(false);
    setQuizShowExplanation(false);
  }

  function startQuizSession(questionSet) {
    if (!Array.isArray(questionSet) || questionSet.length === 0) return;
    setQuizQuestions(questionSet.slice(0, MAX_QUIZ_QUESTIONS));
    setQuizIndex(0);
    setQuizSelections({});
    setQuizCheckedState({});
    setQuizComplete(false);
    setQuizShowExplanation(false);
    setQuizLoading(false);
    setQuizReviewOpen(false);
    setQuizModalOpen(true);
  }

  function runLocalQuestionFallback(seeds) {
    const mcqs = generateQuestionsFromSubtopics(seeds, 10);
    const sanitized = sanitizeQuestionSet(mcqs);
    startQuizSession(sanitized);
  }

  function handleQuizSelect(optionIdx) {
    if (quizCheckedState[quizIndex]) return;
    setQuizSelections((prev) => ({ ...prev, [quizIndex]: optionIdx }));
  }

  function handleQuizCheck() {
    const current = quizQuestions[quizIndex];
    if (!current) return;
    const selected = quizSelections[quizIndex];
    if (!Number.isInteger(selected)) return;
    setQuizCheckedState((prev) => {
      if (prev[quizIndex]) return prev;
      const outcome = selected === current.correctIndex ? 'correct' : 'incorrect';
      setQuizShowExplanation(true);
      return { ...prev, [quizIndex]: outcome };
    });
  }

  function handleQuizNext() {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((idx) => idx + 1);
      setQuizShowExplanation(false);
    } else {
      setQuizComplete(true);
      setQuizShowExplanation(false);
      setQuizReviewOpen(true);
    }
  }

  function handleQuizClose() {
    setQuizModalOpen(false);
    setQuizLoading(false);
  }

  function handleQuizRestart() {
    startQuizSession([...quizQuestions]);
  }

  function selectAllSubtopics() {
    setSubtopicsIncluded((prev) => {
      const next = {};
      (topic.subtopics || []).forEach((_, idx) => {
        next[idx] = true;
      });
      return Object.keys(prev).length && Object.keys(prev).every((key) => prev[key]) ? prev : next;
    });
  }

  function clearSubtopicSelection() {
    setSubtopicsIncluded((prev) => {
      const next = {};
      (topic.subtopics || []).forEach((_, idx) => {
        next[idx] = false;
      });
      return Object.keys(prev).length && Object.values(prev).every((v) => v === false) ? prev : next;
    });
  }

  function isSubtopicIncluded(idx) {
    if (typeof subtopicsIncluded[idx] === 'boolean') return subtopicsIncluded[idx];
    return true;
  }

  function buildAggregatedNotes(selectedIndexes) {
    const parts = [];
    if (notes && String(notes).trim()) {
      parts.push('== Topic Notes ==\n' + String(notes).trim());
    }
    const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    const subSections = [];
    selectedIndexes.forEach((idx) => {
      const label = subtopics[idx];
      const sum = subtopicSummaries[idx] || '';
      const guide = subtopicStudyGuides[idx] || '';
      if ((sum && String(sum).trim()) || (guide && String(guide).trim())) {
        const lines = [];
        lines.push(`-- ${label || `Subtopic ${idx + 1}`} --`);
        if (sum && String(sum).trim()) lines.push('Summary:\n' + String(sum).trim());
        if (guide && String(guide).trim()) lines.push('Study Guide:\n' + String(guide).trim());
        subSections.push(lines.join('\n'));
      }
    });
    if (subSections.length > 0) {
      parts.push('== Subtopic Notes ==\n' + subSections.join('\n\n'));
    }
    const readingSections = [];
    (topic.readings || []).forEach((r, idx) => {
      const includeThis = !!readingIncluded[idx];
      if (!includeThis) return;
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

  const selectedSubtopicIndexes = getIncludedSubtopicIndexes();
  const selectedSubtopicCount = selectedSubtopicIndexes.length;
  const selectedReadingIndexes = getIncludedReadingIndexes();
  const selectedReadingCount = selectedReadingIndexes.length;
  const selectedSourceCount = selectedSubtopicCount + selectedReadingCount;
  const hasSelectedSources = selectedSourceCount > 0;
  const currentQuizQuestion = quizQuestions[quizIndex] || null;
  const currentQuizSelection = quizSelections[quizIndex];
  const currentQuizStatus = quizCheckedState[quizIndex];
  const currentQuizChecked = Boolean(currentQuizStatus);
  const currentQuizCorrect = currentQuizStatus === 'correct';
  const quizTotalQuestions = quizQuestions.length || MAX_QUIZ_QUESTIONS;
  const quizAnsweredCount = Object.keys(quizCheckedState).length;
  const quizProgressPct = quizTotalQuestions > 0 ? Math.round((quizAnsweredCount / quizTotalQuestions) * 100) : 0;
  const quizScore = Object.values(quizCheckedState).filter((v) => v === 'correct').length;

  function choiceLabel(idx) {
    return String.fromCharCode(65 + idx);
  }

  function quizPrimaryButtonStyle(disabled) {
    return {
      background: disabled ? '#94a3b8' : '#2563eb',
      borderColor: disabled ? '#94a3b8' : '#2563eb',
      color: '#fff',
    };
  }

  async function handleGenerateQuestions() {
    setAiError('');
    setAiLoading(true);
    const selectedSubtopicIdx = getIncludedSubtopicIndexes({ strict: true });
    const selectedReadingIdx = getIncludedReadingIndexes();
    if (selectedSubtopicIdx.length === 0 && selectedReadingIdx.length === 0) {
      setAiError('Select at least one subtopic or reading to generate questions.');
      setAiLoading(false);
      return;
    }
    const localSeeds = [
      ...buildSubtopicQuestionSeeds(selectedSubtopicIdx),
      ...buildReadingQuestionSeeds(selectedReadingIdx),
    ];
    if (localSeeds.length === 0) {
      setAiError('Add summaries or notes for the selected items before generating.');
      setQuizModalOpen(false);
      setQuizLoading(false);
      setAiLoading(false);
      return;
    }
    beginQuizGeneration();
    try {
      const aggregatedNotes = buildAggregatedNotes(selectedSubtopicIdx);
      const selectedSubtopics = selectedSubtopicIdx
        .map((idx) => (topic.subtopics || [])[idx])
        .filter((label) => typeof label === 'string' && label.trim())
        .map((label) => `Topic: ${label.trim()}`);
      const selectedReadings = selectedReadingIdx
        .map((idx) => {
          const entry = readings[idx];
          if (entry && typeof entry.title === 'string' && entry.title.trim()) {
            return `Reading: ${entry.title.trim()}`;
          }
          return `Reading ${idx + 1}`;
        });
      const selectedSources = [...selectedSubtopics, ...selectedReadings];
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: topic.title,
          subtopics: selectedSources,
          notes: aggregatedNotes,
          count: MAX_QUIZ_QUESTIONS,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const remoteQuestions = Array.isArray(data.questions) ? data.questions : [];
        const sanitized = sanitizeQuestionSet(remoteQuestions);
        if (sanitized.length > 0) {
          startQuizSession(sanitized);
        } else {
          runLocalQuestionFallback(localSeeds);
        }
      } else {
        runLocalQuestionFallback(localSeeds);
      }
    } catch (_) {
      runLocalQuestionFallback(localSeeds);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section className="topic-section" id={`topic-${topic.id}`} data-topicid={String(topic.id)}>
      <div className="topic-header">
        <div className="topic-title">{topic.title}</div>
        <div className="topic-weight">{allComplete ? 'Complete ✓' : `${topic.weight}% weight`}</div>
      </div>

      <div className="quiz-launch-card">
        <div>
          <p className="eyebrow">Practice mode</p>
          <h2>Generate questions anytime</h2>
          <p className="quiz-launch-copy">
            {hasSelectedSources
              ? `Ready to build a quiz using ${selectedSourceCount} selected section${selectedSourceCount === 1 ? '' : 's'}.`
              : 'Tap the 🎯 icon next to any subtopic or reading to stage it for the quiz.'}
          </p>
        </div>
        <div className="quiz-launch-actions">
          <button
            className="btn primary large question-btn"
            disabled={!hasSelectedSources || aiLoading}
            onClick={handleGenerateQuestions}
          >
            {aiLoading
              ? 'Generating...'
              : quizQuestions.length > 0
              ? 'Regenerate Questions'
              : 'Generate Questions'}
          </button>
          <span className="quiz-launch-hint">
            {hasSelectedSources
              ? 'You can keep scrolling—this shortcut stays pinned.'
              : 'Need at least one selection to unlock the button.'}
          </span>
          {quizQuestions.length > 0 && !quizModalOpen ? (
            <button className="btn ghost" onClick={() => setQuizModalOpen(true)}>
              Open latest quiz
            </button>
          ) : null}
          {aiError ? <div className="quiz-launch-error">{aiError}</div> : null}
        </div>
      </div>

      <div className="subtopics">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <div>
            <strong>Select Topics & Build a Quiz</strong>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>Toggle 🎯 next to subtopics or readings to feed the quiz generator.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn ghost" onClick={selectAllSubtopics}>Select All</button>
            <button className="btn ghost" onClick={clearSubtopicSelection}>Clear</button>
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(topic.subtopics || []).map((s, i) => (
            <li
              key={i}
              id={`subtopic-${topic.id}-${i}`}
              style={{
                background: i % 2 === 0 ? '#f8fafc' : '#fff',
                borderRadius: 10,
                padding: '8px 10px',
                marginBottom: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{s}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button
                    className="icon-btn"
                    style={{ background: isSubtopicIncluded(i) ? '#e6f5cf' : '#fff' }}
                    title={isSubtopicIncluded(i) ? 'Included in quiz generation' : 'Click to include in quiz generation'}
                    onClick={() =>
                      setSubtopicsIncluded((prev) => ({
                        ...prev,
                        [i]: !isSubtopicIncluded(i),
                      }))
                    }
                  >🎯</button>
                  <button
                    className="icon-btn"
                    title="Open LLM notes editors for this subtopic"
                    onClick={() => {
                      setOpenSubtopicIdx((cur) => {
                        const next = cur === i ? null : i;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h4 style={{ margin: 0 }}>Readings</h4>
          <div style={{ fontSize: 13, color: '#475569' }}>Toggle 🎯 to pull notes into the quiz.</div>
        </div>
        {readings.length === 0 ? (
          <div className="progress-text">No readings provided.</div>
        ) : (
          readings.map((r, idx) => (
            <div key={r.url || `${topic.id}-${idx}`} className="reading-row">
              <div className="reading-main">
                <div className="reading-title-row">
                  <input
                    type="checkbox"
                    title="Mark reading complete"
                    aria-label="Mark reading complete"
                    checked={readingsComplete.includes(idx)}
                    onChange={() => toggleReadingComplete(topic.id, idx)}
                  />
                  <a
                    className="reading-link"
                    href={r.url}
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        window.open(r.url, '_blank', 'noopener,noreferrer');
                      } catch {
                        window.location.href = r.url;
                      }
                      if (!readingUserNotes[idx]) {
                        updateReadingNotes(topic.id, idx, '');
                      }
                      setOpenReadingEditorIdx(idx);
                    }}
                  >
                    {r.title}
                  </a>
                </div>
                {readingCompletedAt[idx] ? (
                  <div className="reading-meta">
                    <span className="reading-pill">Completed {formatDate(readingCompletedAt[idx])}</span>
                  </div>
                ) : null}
              </div>
              <div className="reading-actions">
                <button
                  type="button"
                  className="icon-btn"
                  style={{ background: readingIncluded[idx] ? '#e6f5cf' : '#fff' }}
                  title={readingIncluded[idx] ? 'Included in Generate Questions' : 'Click to include in Generate Questions'}
                  onClick={() => setReadingIncluded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                >🎯</button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Open notes for this reading"
                  onClick={() => {
                    if (!readingUserNotes[idx]) {
                      updateReadingNotes(topic.id, idx, '');
                    }
                    setOpenReadingEditorIdx((cur) => (cur === idx ? null : idx));
                  }}
                >📝</button>
              </div>
            </div>
          ))
        )}
      </div>

      {openReadingEditorIdx !== null && (
        <div className="reading-notes">
          <div className="notes-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong>Notes for: {readings[openReadingEditorIdx]?.title}</strong>
              <div className="notes-status">
                {readingSaveState[openReadingEditorIdx] === 'saving'
                  ? 'Saving...'
                  : readingSaveState[openReadingEditorIdx] === 'saved'
                  ? 'Saved'
                  : ''}
              </div>
            </div>
            {readingNotes[openReadingEditorIdx] ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => setOpenReadingIdx(openReadingEditorIdx)}
              >
                View completion snapshot
              </button>
            ) : null}
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
          <div className="notes-header" style={{ marginTop: 8, alignItems: 'center', gap: 12 }}>
            <div className="char-count">{plainTextLength(readingUserNotes[openReadingEditorIdx])} characters</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {readingNotes[openReadingEditorIdx] ? (
                <button
                  className="btn ghost"
                  onClick={() => setOpenReadingIdx(openReadingEditorIdx)}
                >
                  View completion snapshot
                </button>
              ) : null}
              <button className="btn" onClick={() => setReadingStatus(openReadingEditorIdx, 'saved')}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

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

      {quizModalOpen && (
        <div className="modal-overlay" onClick={handleQuizClose}>
          <div
            className="modal-dialog"
            style={{
              maxWidth: 680,
              width: '90%',
              maxHeight: '90vh',
              padding: '24px 26px',
              borderRadius: 18,
              background: '#fff',
              boxShadow: '0 20px 45px rgba(15,23,42,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
              <strong>Practice Quiz</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={handleQuizRestart}>Restart</button>
                <button className="btn" onClick={handleQuizClose}>Close</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, paddingTop: 16 }}>
            {quizLoading && quizQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#2563eb' }}>Generating questions…</div>
                <div style={{ marginTop: 8, color: '#475569' }}>Hang tight while we build a tailored quiz.</div>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="progress-text">No questions available yet.</div>
            ) : quizComplete ? (
              <div className="quiz-summary">
                <div style={{ fontSize: 18, fontWeight: 600 }}>Quiz complete</div>
                <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: '#15803d' }}>
                  {quizScore}/{quizQuestions.length}
                </div>
                <div className="progress-text">Nice work! Generate again, review answers, or close this window to resume studying.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, position: 'sticky', top: 0, background: '#fff', paddingBottom: 10 }}>
                  <button className="btn primary" onClick={handleQuizRestart}>Retake Quiz</button>
                  <button className="btn" onClick={() => setQuizReviewOpen((prev) => !prev)}>
                    {quizReviewOpen ? 'Hide Review' : 'Review Answers'}
                  </button>
                  <button className="btn" style={quizPrimaryButtonStyle(false)} onClick={handleQuizClose}>Close & Resume</button>
                </div>
                {quizReviewOpen && (
                  <div className="quiz-review-list" style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {quizQuestions.map((question, idx) => {
                      const selected = quizSelections[idx];
                      const correct = question.correctIndex;
                      const status = quizCheckedState[idx];
                      const isCorrect = status === 'correct';
                      return (
                        <div
                          key={idx}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '12px 14px',
                            background: '#fff',
                            boxShadow: '0 6px 16px rgba(15,23,42,0.06)',
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>
                            Q{idx + 1}. {question.question}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 14 }}>
                            <span style={{ color: isCorrect ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                              Your answer: {Number.isInteger(selected) ? `${choiceLabel(selected)}${question.choices ? `. ${question.choices[selected]}` : ''}` : '—'}
                            </span>
                            <span>
                              Correct: {Number.isInteger(correct) ? `${choiceLabel(correct)}${question.choices ? `. ${question.choices[correct]}` : ''}` : '—'}
                            </span>
                          </div>
                          {question.explanation ? (
                            <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#475569', marginBottom: 6, position: 'sticky', top: 0, background: '#fff', paddingBottom: 8, zIndex: 1 }}>
                  <div>Question {quizIndex + 1} of {quizQuestions.length}</div>
                  <div>Score: {quizScore}/{quizQuestions.length}</div>
                </div>
                <div style={{ width: '100%', height: 4, borderRadius: 999, background: '#e2e8f0', marginBottom: 12 }}>
                  <div style={{ width: `${quizProgressPct}%`, height: '100%', borderRadius: 999, background: '#22c55e', transition: 'width 0.25s ease' }} />
                </div>
                <div
                  className="quiz-card"
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
                  }}
                >
                  <div className="mcq-stem" style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>
                    {currentQuizQuestion?.question}
                  </div>
                  <div className="mcq-options" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(currentQuizQuestion?.choices || []).map((choice, idx) => {
                      const isSelected = currentQuizSelection === idx;
                      const isCorrect = currentQuizChecked && idx === currentQuizQuestion.correctIndex;
                      const isWrong = currentQuizChecked && isSelected && idx !== currentQuizQuestion.correctIndex;
                      const cls =
                        'mcq-option' +
                        (isCorrect ? ' correct' : '') +
                        (isWrong ? ' wrong' : '') +
                        (!isCorrect && !isWrong && isSelected ? ' selected' : '');
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={cls}
                          onClick={() => handleQuizSelect(idx)}
                          disabled={currentQuizChecked}
                          style={{
                            textAlign: 'left',
                            borderRadius: 10,
                            padding: '10px 12px',
                          }}
                        >
                          <span style={{ fontWeight: 600, marginRight: 6 }}>{String.fromCharCode(65 + idx)}.</span>
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mcq-actions" style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', position: 'sticky', bottom: 0, background: '#fff', paddingTop: 10, paddingBottom: 10 }}>
                  <button
                    className="btn"
                    style={quizPrimaryButtonStyle(!Number.isInteger(currentQuizSelection) || currentQuizChecked)}
                    onClick={handleQuizCheck}
                    disabled={!Number.isInteger(currentQuizSelection) || currentQuizChecked}
                  >
                    {currentQuizChecked ? 'Checked' : 'Check Answer'}
                  </button>
                  <button
                    className="btn"
                    onClick={handleQuizNext}
                    disabled={!currentQuizChecked}
                  >
                    {quizIndex + 1 === quizQuestions.length ? 'Finish Quiz' : 'Next Question'}
                  </button>
                </div>
                {currentQuizChecked && (
                  <div
                    className="quiz-expl-card"
                    style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #fde68a',
                      background: '#fef9c3',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      {currentQuizCorrect ? '✅ Correct' : '❌ Not quite'}
                    </div>
                    <div>
                      <strong>Answer:</strong> {currentQuizQuestion && Number.isInteger(currentQuizQuestion.correctIndex) ? `${choiceLabel(currentQuizQuestion.correctIndex)}. ${currentQuizQuestion.choices?.[currentQuizQuestion.correctIndex] ?? ''}` : '—'}
                    </div>
                    {quizShowExplanation && currentQuizQuestion?.explanation ? (
                      <div style={{ marginTop: 6, color: '#92400e' }}>{currentQuizQuestion.explanation}</div>
                    ) : null}
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


