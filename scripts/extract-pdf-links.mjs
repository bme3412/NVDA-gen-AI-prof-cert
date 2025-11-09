import fs from 'node:fs/promises';
import path from 'node:path';

if (process.argv.length < 3) {
  console.error('Usage: node scripts/extract-pdf-links.mjs /absolute/path/to/file.pdf');
  process.exit(2);
}

const pdfPath = path.resolve(process.argv[2]);

function unique(arr) {
  return Array.from(new Set(arr));
}

function normalizeUrl(u) {
  // Trim trailing punctuation commonly stuck to URLs in text
  return u.replace(/[)>.,]+$/g, '');
}

async function main() {
  const buf = await fs.readFile(pdfPath);
  // Interpret as latin1 to preserve bytes; URLs are ASCII so they'll be intact
  const text = buf.toString('latin1');
  const regex = /https?:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+/g;
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push(normalizeUrl(m[0]));
  }
  const urls = unique(matches).sort();
  console.log(JSON.stringify(urls, null, 2));
}

main().catch((err) => {
  console.error('Failed to extract links:', err);
  process.exit(1);
});


