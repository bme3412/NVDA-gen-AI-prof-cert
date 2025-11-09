function normalize(text) {
  if (!text) return '';
  return String(text).replace(/^\d+\.\d+\s*/, '').trim();
}

function makeVariants(topicLine) {
  const base = normalize(topicLine);
  if (!base) return [];
  return [
    `Explain: ${base}.`,
    `List key steps or considerations for: ${base}.`,
    `What potential pitfalls or trade-offs exist when you ${base.toLowerCase()}?`,
    `Provide a concrete example or use case related to: ${base}.`,
  ];
}

export function generateQuestionsFromSubtopics(subtopics, max = 10) {
  const out = [];
  for (const line of subtopics || []) {
    for (const q of makeVariants(line)) {
      out.push(q);
      if (out.length >= max) return out;
    }
  }
  return out;
}


