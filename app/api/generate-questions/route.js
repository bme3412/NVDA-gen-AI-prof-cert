export const dynamic = 'force-dynamic';

function buildSystemPrompt() {
  return (
    'You are an expert exam item writer for the NVIDIA-Certified Professional: Gen AI LLMs exam. ' +
    'Generate high-quality practice questions that are specific, technically accurate, and varied (mix short-answer, conceptual, scenario-based, and multiple-choice). ' +
    'Incorporate the provided subtopics and personal notes to tailor the content. ' +
    'Return ONLY valid JSON with the following shape: ' +
    '{"questions":[{"type":"short|mcq|scenario","question":"string","choices":["A","B","C","D"],"answer":"string","explanation":"string"}]}. ' +
    'For non-MCQ, omit the choices field. Provide 6-10 questions total.'
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
    'Generate questions now.'
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
    // Trim to requested count
    if (Array.isArray(parsed.questions) && count) parsed.questions = parsed.questions.slice(0, count);
    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}


