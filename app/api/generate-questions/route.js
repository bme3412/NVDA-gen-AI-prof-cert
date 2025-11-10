export const dynamic = 'force-dynamic';

function buildSystemPrompt() {
  return (
    'You are an expert exam item writer for the NVIDIA-Certified Professional: Gen AI LLMs exam. ' +
    'Generate only multiple-choice questions (MCQ). Each question must have EXACTLY 4 choices and one correct answer. ' +
    'Use the provided subtopics and personal notes to make the questions targeted and technically accurate. ' +
    'Write clear stems and ensure only one unambiguously correct option; make the 3 distractors plausible but wrong. ' +
    'Explanations should be concise (1–3 sentences) and cite the key concept or mechanism that makes the correct option right. ' +
    'Return ONLY valid JSON with this exact shape (no extra text): ' +
    '{"questions":[{"question":"string","choices":["A","B","C","D"],"correctIndex":0,"explanation":"string"}]}. ' +
    'The correctIndex is an integer from 0 to 3 that points to the correct choice. Provide 6-10 questions total.'
  );
}

function buildUserPrompt({ topicTitle, subtopics, notes }) {
  const lines = Array.isArray(subtopics) ? subtopics : [];
  const sub = lines.map((s, i) => `- ${s}`).join('\n');
  const notesStr = (notes || '').trim();
  return (
    `Topic: ${topicTitle}\n` +
    `Subtopics:\n${sub}\n\n` +
    (notesStr ? `Learner notes:\n${notesStr}\n\n` : '') +
    'Generate MCQs now.'
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { topicTitle, subtopics, notes, model = 'gpt-4o-mini', count = 8 } = body || {};
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500 });
    }
    if (!topicTitle || !Array.isArray(subtopics)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    const system = buildSystemPrompt();
    const user = buildUserPrompt({ topicTitle, subtopics, notes });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: 'OpenAI error', detail: text }), { status: 502 });
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { questions: [] };
    }
    // Normalize to MCQ-only shape
    let questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    questions = questions.map((q) => {
      const question = String(q.question || '').trim();
      const choices = Array.isArray(q.choices) ? q.choices.map((c) => String(c || '')) : [];
      let correctIndex = Number.isInteger(q.correctIndex) ? q.correctIndex : -1;
      if (correctIndex < 0 && typeof q.answer === 'string' && choices.length > 0) {
        const idx = choices.findIndex((c) => c.trim() === String(q.answer || '').trim());
        correctIndex = idx >= 0 ? idx : -1;
      }
      if (correctIndex < 0 && choices.length === 4 && typeof q.answer === 'number') {
        correctIndex = q.answer;
      }
      const explanation = String(q.explanation || '').trim();
      return { question, choices, correctIndex, explanation };
    }).filter((q) => q.question && Array.isArray(q.choices) && q.choices.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4);
    if (count) questions = questions.slice(0, count);
    return new Response(JSON.stringify({ questions }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}


