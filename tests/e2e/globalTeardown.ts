import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const composeProject = process.env.E2E_COMPOSE_PROJECT ?? 'herzgarten-e2e';
const composeArgs = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.e2e.yml', '-p', composeProject];

function runDocker(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('docker', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`docker ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function runDockerWithOutput(args: string[]) {
  return new Promise<string>((resolve, reject) => {
    let output = '';
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`docker ${args.join(' ')} exited with code ${code}\n${output}`));
    });
  });
}

async function writeAutoExplainLog() {
  const logPath = resolve(process.env.E2E_DB_AUTO_EXPLAIN_LOG ?? 'test-results/e2e-db-auto-explain.log');
  const output = await runDockerWithOutput([...composeArgs, 'logs', '--no-color', 'db']);
  const report = [
    'E2E Postgres auto_explain log',
    `Generated at: ${new Date().toISOString()}`,
    `Compose project: ${composeProject}`,
    '',
    output.trim(),
    '',
  ].join('\n');

  await mkdir(dirname(logPath), { recursive: true });
  await writeFile(logPath, report, 'utf8');
  console.log(`E2E Postgres auto_explain log written to ${logPath}`);
}

async function writeQueryPerformanceReport() {
  const reportPath = resolve(process.env.E2E_DB_PERF_REPORT ?? 'test-results/e2e-db-query-performance.log');
  const query = `
SELECT
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  rows,
  shared_blks_read,
  shared_blks_hit,
  left(regexp_replace(query, '\\s+', ' ', 'g'), 2000) AS sql
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 25;
`.trim();

  const output = await runDockerWithOutput([
    ...composeArgs,
    'exec',
    '-T',
    'db',
    'psql',
    '-U',
    'herzgarten',
    '-d',
    'herzgarten',
    '-P',
    'pager=off',
    '-c',
    query,
  ]);

  const report = [
    'E2E Postgres query performance report',
    `Generated at: ${new Date().toISOString()}`,
    `Compose project: ${composeProject}`,
    '',
    output.trim(),
    '',
  ].join('\n');

  console.log(`\n${report}`);
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, 'utf8');
  console.log(`E2E Postgres query performance report written to ${reportPath}`);
}

export default async function globalTeardown() {
  if (process.env.E2E_SKIP_DOCKER === '1') return;
  try {
    await writeQueryPerformanceReport();
  } catch (error) {
    console.error('Failed to write E2E Postgres query performance report:', error);
  }
  try {
    await writeAutoExplainLog();
  } catch (error) {
    console.error('Failed to write E2E Postgres auto_explain log:', error);
  }
  if (process.env.E2E_KEEP_DOCKER === '1') return;
  await runDocker([...composeArgs, 'down', '-v', '--remove-orphans']);
}
