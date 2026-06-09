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
  await waitFor(process.env.E2E_BACKEND_HEALTH_URL ?? 'http://localhost:3000/health', 'Backend');
}
