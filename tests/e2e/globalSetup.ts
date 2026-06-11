import { spawn } from 'node:child_process';

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

async function waitFor(url: string, label: string) {
  const deadline = Date.now() + 120_000;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`${label} did not become ready at ${url}: ${lastError}`);
}

export default async function globalSetup() {
  if (process.env.E2E_SKIP_DOCKER !== '1') {
    await runDocker([...composeArgs, 'down', '-v', '--remove-orphans']);
    await runDocker([...composeArgs, 'up', '--build', '-d']);
  }
  await waitFor(process.env.E2E_BACKEND_HEALTH_URL ?? 'http://localhost:3001/health', 'Backend');
  await waitFor(process.env.E2E_BASE_URL ?? 'http://localhost:5174', 'Frontend');
}
