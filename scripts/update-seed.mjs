import fs from 'node:fs/promises';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/update-seed.mjs /path/to/source.json');
  console.error('Source JSON must include a top-level "topics" object.');
  process.exit(2);
}

async function main() {
  const [, , inputPath] = process.argv;
  if (!inputPath) usage();

  const projectRoot = path.resolve(process.cwd());
  const seedPath = path.join(projectRoot, 'public', 'notes-seed.json');
  const resolvedInput = path.resolve(inputPath);

  let raw;
  try {
    raw = await fs.readFile(resolvedInput, 'utf8');
  } catch (err) {
    console.error(`Failed to read source file "${resolvedInput}":`, err.message);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Source file does not contain valid JSON:', err.message);
    process.exit(1);
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error('Source JSON must be an object.');
    process.exit(1);
  }
  if (!parsed.topics || typeof parsed.topics !== 'object') {
    console.error('Source JSON must include a top-level "topics" object.');
    process.exit(1);
  }

  const topicCount = Object.keys(parsed.topics).length;
  const pretty = `${JSON.stringify(parsed, null, 2)}\n`;

  try {
    await fs.writeFile(seedPath, pretty, 'utf8');
  } catch (err) {
    console.error(`Failed to write seed file at "${seedPath}":`, err.message);
    process.exit(1);
  }

  console.log(`Updated ${seedPath}`);
  console.log(`Topics copied: ${topicCount}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});


