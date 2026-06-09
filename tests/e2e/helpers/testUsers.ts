export interface TestUser {
  displayName: string;
  email: string;
  password: string;
}

export function testRunId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function testUser(prefix: string, runId = testRunId()): TestUser {
  return {
    displayName: `E2E ${prefix}`,
    email: `e2e-${prefix.toLowerCase()}-${runId}@example.test`,
    password: 'password123',
  };
}
