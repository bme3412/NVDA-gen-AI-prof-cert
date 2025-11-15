function normalize(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+(?:\.\d+)*\s*/, '')
    .trim();
}

const QUESTION_TEMPLATES = [
  (label) => `Which statement best captures the goal of ${label}?`,
  (label) => `What should you remember about ${label}?`,
  (label) => `Why is ${label} important when preparing for the exam?`,
  (label) => `When thinking about ${label}, which option is correct?`,
];

const SUMMARY_TEMPLATES = [
  (label) => `According to the summary, what matters most for ${label}?`,
  (label) => `What does the summary highlight about ${label}?`,
];

const GUIDE_TEMPLATES = [
  (label) => `The study guide for ${label} recommends which action?`,
  (label) => `When following the study guide, what should you do for ${label}?`,
];

const DISTRACTOR_TEMPLATES = [
  (label) => `${label} is purely about budgeting and procurement tasks.`,
  (label) => `${label} focuses only on physical cabling and rack layout.`,
  (label) => `${label} applies exclusively to legacy 2D graphics pipelines.`,
  (label) => `${label} is unrelated to Gen AI or LLM workflows.`,
  (label) => `${label} is mainly a finance compliance requirement.`,
  (label) => `${label} only addresses desktop productivity software.`,
];

const GENERIC_FACT_TEMPLATES = [
  (label) => `${label} ensures Gen AI systems stay reliable in production.`,
  (label) => `${label} helps teams deploy and govern LLM solutions.`,
  (label) => `${label} is essential for delivering NVIDIA-certified outcomes.`,
  (label) => `${label} keeps Gen AI infrastructure aligned with best practices.`,
];

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function shuffleWithSeed(arr, seed) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickTemplate(type, label, idx) {
  if (type === 'summary') {
    return SUMMARY_TEMPLATES[idx % SUMMARY_TEMPLATES.length](label);
  }
  if (type === 'guide') {
    return GUIDE_TEMPLATES[idx % GUIDE_TEMPLATES.length](label);
  }
  return QUESTION_TEMPLATES[idx % QUESTION_TEMPLATES.length](label);
}

function selectDistractors(label, count, seed, correct) {
  const out = [];
  let cursor = seed % DISTRACTOR_TEMPLATES.length;
  while (out.length < count) {
    const candidate = DISTRACTOR_TEMPLATES[cursor % DISTRACTOR_TEMPLATES.length](label);
    if (candidate !== correct && !out.includes(candidate)) {
      out.push(candidate);
    }
    cursor += 1;
  }
  return out;
}

function ensureSentence(text) {
  const trimmed = normalize(text);
  if (!trimmed) return '';
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function buildExplanation(type, label, fact) {
  const detail = ensureSentence(fact);
  if (type === 'summary') {
    return detail ? `The summary explicitly notes that ${detail}` : `The summary calls out ${label} as a priority.`;
  }
  if (type === 'guide') {
    return detail ? `The study guide instructs you to remember that ${detail}` : `The study guide focuses on hands-on practice with ${label}.`;
  }
  return detail ? `This option aligns with the core idea behind ${label}: ${detail}` : `Only this option reflects what ${label} truly covers.`;
}

function fallbackFact(label, seed) {
  const tmpl = GENERIC_FACT_TEMPLATES[seed % GENERIC_FACT_TEMPLATES.length];
  return tmpl(label);
}

function toSeedObject(raw, idx) {
  if (!raw && raw !== 0) return null;
  if (typeof raw === 'string') {
    const text = normalize(raw);
    if (!text) return null;
    return { label: text, fact: text, detailType: 'label' };
  }
  if (typeof raw === 'object') {
    const label = normalize(raw.label || raw.topic || raw.title || raw.fact || '');
    const fact = normalize(raw.fact || raw.detail || raw.description || raw.text || '');
    const detailType = raw.detailType || 'label';
    if (!label && !fact) return null;
    return {
      label: label || fact || `Concept ${idx + 1}`,
      fact: fact || label || fallbackFact(`Concept ${idx + 1}`, idx),
      detailType,
    };
  }
  return null;
}

function makeMcq(seed, idx) {
  if (!seed) return null;
  const label = normalize(seed.label || seed.fact || '');
  const fact = normalize(seed.fact || '') || fallbackFact(label || `Concept ${idx + 1}`, idx);
  const type = seed.detailType || 'label';
  if (!label && !fact) return null;
  const stemLabel = label || `Concept ${idx + 1}`;
  const question = pickTemplate(type, stemLabel, idx);
  const correctChoice = ensureSentence(fact);
  const distractors = selectDistractors(stemLabel, 3, idx + 3, correctChoice);
  const choices = shuffleWithSeed([correctChoice, ...distractors], idx + 11);
  const correctIndex = choices.indexOf(correctChoice);
  if (correctIndex < 0) return null;
  const explanation = buildExplanation(type, stemLabel, fact);
  return {
    question,
    choices,
    correctIndex,
    explanation,
  };
}

export function generateQuestionsFromSubtopics(subtopics, max = 10) {
  const seeds = (subtopics || []).map((s, idx) => toSeedObject(s, idx)).filter(Boolean);
  const out = [];
  for (let i = 0; i < seeds.length && out.length < max; i += 1) {
    const mcq = makeMcq(seeds[i], i);
    if (mcq) out.push(mcq);
  }
  return out;
}

