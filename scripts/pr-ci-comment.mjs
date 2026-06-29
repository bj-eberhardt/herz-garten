import { readFile } from 'node:fs/promises';

const marker = '<!-- herzgarten-pr-ci-comment -->';

function lintLabel(outcome, configured) {
  if (configured === 'false') return 'not configured';
  return labelFor(outcome);
}

function labelFor(outcome) {
  if (outcome === 'success') return 'success';
  if (outcome === 'failure') return 'failure';
  if (outcome === 'skipped') return 'skipped';
  if (outcome === 'cancelled') return 'cancelled';
  return outcome || 'unknown';
}

function details(summary, body) {
  return `<details>
<summary>${summary}</summary>

${body.trim() || '_No content._'}

</details>`;
}

async function readText(path, fallback = '_File was not generated._') {
  try {
    const content = await readFile(path, 'utf8');
    return content.trim() || '_File is empty._';
  } catch {
    return fallback;
  }
}

function walkSuites(suites, stats) {
  for (const suite of suites ?? []) {
    walkSuites(suite.suites, stats);
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const ran = (test.results ?? []).some((result) => result.status !== 'skipped');
        if (!ran) continue;
        stats.total += 1;
        if (test.outcome === 'expected' || test.outcome === 'flaky') {
          stats.passed += 1;
        }
      }
    }
  }
}

async function readPlaywrightStats() {
  try {
    const raw = await readFile('test-results/playwright-results.json', 'utf8');
    const report = JSON.parse(raw);
    const stats = { passed: 0, total: 0 };
    walkSuites(report.suites, stats);
    return stats;
  } catch {
    return { passed: 0, total: 0 };
  }
}

const frontendBuild = labelFor(process.env.FRONTEND_BUILD_OUTCOME);
const backendBuild = labelFor(process.env.BACKEND_BUILD_OUTCOME);
const frontendLint = lintLabel(process.env.FRONTEND_LINT_OUTCOME, process.env.FRONTEND_LINT_CONFIGURED);
const backendLint = lintLabel(process.env.BACKEND_LINT_OUTCOME, process.env.BACKEND_LINT_CONFIGURED);
const e2e = labelFor(process.env.E2E_OUTCOME);
const reportUrl = process.env.PLAYWRIGHT_REPORT_URL || process.env.RUN_URL || '';
const dbPerf = await readText('test-results/e2e-db-query-performance.log');
const { passed, total } = await readPlaywrightStats();

const summary = [
  marker,
  '## PR CI',
  '',
  `Playwright tests: **${passed}/${total} successful**`,
  '',
  '| Check | Status |',
  '| --- | --- |',
  `| Frontend build | ${frontendBuild} |`,
  `| Backend build | ${backendBuild} |`,
  `| Frontend lint | ${frontendLint} |`,
  `| Backend lint | ${backendLint} |`,
  `| E2E tests | ${e2e} |`,
  '',
  `Playwright report artifact: ${reportUrl ? `[playwright-report](${reportUrl})` : '_not available_'}`,
  '',
  details('DB Query performance', `\`\`\`text\n${dbPerf}\n\`\`\``),
  '',
  details(
    'Artifacts',
    [
      reportUrl ? `- [playwright-report](${reportUrl})` : '- playwright-report: not available',
      process.env.TEST_RESULTS_URL ? `- [test-results](${process.env.TEST_RESULTS_URL})` : '- test-results: not available',
      process.env.RUN_URL ? `- [workflow run](${process.env.RUN_URL})` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  ),
  '',
].join('\n');

console.log(summary);