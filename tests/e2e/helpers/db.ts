import { execFileSync } from 'node:child_process';

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

export function runDbSql(sql: string) {
  const composeProject = process.env.E2E_COMPOSE_PROJECT ?? 'herzgarten-e2e';
  execFileSync(
    'docker',
    [
      'compose',
      '-f',
      'docker-compose.yml',
      '-f',
      'docker-compose.e2e.yml',
      '-p',
      composeProject,
      'exec',
      '-T',
      'db',
      'psql',
      '-U',
      'herzgarten',
      '-d',
      'herzgarten',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    {
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );
}

export function moveDailyQuestionInstanceToYesterday(instanceId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(instanceId)) {
    throw new Error(`Invalid daily question instance id: ${instanceId}`);
  }

  runDbSql(`
    update daily_question_instances
    set date = current_date - interval '1 day'
    where id = ${sqlLiteral(instanceId)};
  `);
}
