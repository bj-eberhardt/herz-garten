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

export default async function globalTeardown() {
  if (process.env.E2E_SKIP_DOCKER === '1' || process.env.E2E_KEEP_DOCKER === '1') return;
  await runDocker([...composeArgs, 'down', '-v', '--remove-orphans']);
}
