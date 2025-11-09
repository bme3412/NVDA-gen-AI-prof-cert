import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const topicsPath = path.join(projectRoot, 'lib', 'topics.js');

function extractUrls(fileContent) {
  const urls = new Set();
  const regex = /url:\s*"(http[^"]+)"/g;
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    urls.add(match[1]);
  }
  return Array.from(urls);
}

async function fetchWithFallback(url) {
  try {
    const resHead = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { status: resHead.status, ok: resHead.ok, finalUrl: resHead.url };
  } catch {
    try {
      const resGet = await fetch(url, { method: 'GET', redirect: 'follow' });
      return { status: resGet.status, ok: resGet.ok, finalUrl: resGet.url };
    } catch (err) {
      return { status: 0, ok: false, finalUrl: url, error: String(err) };
    }
  }
}

async function main() {
  const content = await fs.readFile(topicsPath, 'utf8');
  const urls = extractUrls(content);
  console.log(`Found ${urls.length} unique URLs in lib/topics.js\n`);

  let failures = 0;
  for (const url of urls) {
    const { status, ok, finalUrl, error } = await fetchWithFallback(url);
    if (!ok || status < 200 || status >= 400) {
      failures += 1;
      console.log(`FAIL ${String(status).padStart(3, ' ')} ${url}${finalUrl && finalUrl !== url ? ` -> ${finalUrl}` : ''}${error ? ` (${error})` : ''}`);
    } else {
      console.log(`OK   ${String(status).padStart(3, ' ')} ${url}${finalUrl && finalUrl !== url ? ` -> ${finalUrl}` : ''}`);
    }
  }
  console.log(`\nTotal failures: ${failures}`);
  process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 2;
});


