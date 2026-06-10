import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP_DIR = join(import.meta.dirname, '..');
const AUDIT_DIR = join(APP_DIR, 'audit');
const REPORT_PATH = join(AUDIT_DIR, 'lighthouse.json');
const SUMMARY_PATH = join(AUDIT_DIR, 'summary.json');
const TARGET_URL = 'http://localhost:4173/';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const INITIAL_TRANSFER_BUDGET_KB = 250;
const IMAGE_REQUEST_PATTERN = /\/img\/.+\.webp(?:\?|$)|sonto\.tech\/cache\//;
const PROFILE = 'local-preview';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))));
    child.on('error', reject);
  });
}

async function isPreviewReady() {
  try {
    const response = await fetch(TARGET_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForPreview() {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await isPreviewReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview did not become ready at ${TARGET_URL}`);
}

function stopPreview(preview) {
  if (!preview?.pid) return;
  try {
    process.kill(-preview.pid, 'SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

function readScores(report) {
  return Object.fromEntries(
    CATEGORIES.map((key) => [key, Math.round(report.categories[key].score * 100)]),
  );
}

function readInitialTransferKB(report) {
  const items = report.audits['network-requests'].details.items;
  return Math.round(
    items
      .filter((item) => !IMAGE_REQUEST_PATTERN.test(item.url))
      .reduce((sum, item) => sum + (item.transferSize ?? 0), 0) / 1024,
  );
}

const preview = (await isPreviewReady())
  ? null
  : spawn('pnpm', ['preview', '--host', '127.0.0.1'], {
      cwd: APP_DIR,
      stdio: 'ignore',
      detached: true,
    });

try {
  if (preview) await waitForPreview();
  mkdirSync(AUDIT_DIR, { recursive: true });

  await run('pnpm', [
    'exec',
    'lighthouse',
    TARGET_URL,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--output=json',
    `--output-path=${REPORT_PATH}`,
    '--chrome-flags=--headless=new',
    '--throttling-method=provided',
    '--quiet',
  ], { cwd: APP_DIR });

  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  const scores = readScores(report);
  const totalTransferKB = readInitialTransferKB(report);
  const summary = {
    scores,
    totalTransferKB,
    lighthouseVersion: report.lighthouseVersion,
    measuredAt: report.fetchTime.slice(0, 10),
    profile: PROFILE,
  };

  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);

  const failures = [];
  for (const [key, value] of Object.entries(scores)) {
    if (value < 100) failures.push(`${key}: ${value}`);
  }
  if (totalTransferKB > INITIAL_TRANSFER_BUDGET_KB) {
    failures.push(`initial transfer ${totalTransferKB} KB exceeds ${INITIAL_TRANSFER_BUDGET_KB} KB`);
  }

  console.log(JSON.stringify(summary, null, 2));
  if (failures.length > 0) {
    console.error(`AUDIT FAILED:\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('AUDIT PASSED: 100 / 100 / 100 / 100 within budget');
  }
} finally {
  stopPreview(preview);
}
