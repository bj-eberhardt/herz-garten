import { expect, test } from '@playwright/test';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();

async function source(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

test.describe('api architecture / backend boundaries', () => {
  test('keeps routes free of direct repository queries', async () => {
    const routeDir = path.join(projectRoot, 'backend/src/api/routes');
    const apiRoutes = (await readdir(routeDir))
      .filter((filename) => filename.endsWith('.ts'))
      .map((filename) => `backend/src/api/routes/${filename}`);
    const routeFiles = ['backend/src/adminRoutes.ts', ...apiRoutes];

    for (const routeFile of routeFiles) {
      const content = await source(routeFile);
      expect(content, routeFile).not.toContain('pool.query');
      expect(content, routeFile).not.toContain('client.query');
      expect(content, routeFile).not.toContain('pool.connect');
    }
  });

  test('does not keep empty support facade files around', async () => {
    await test.step('Assert: empty support facade files are absent', async () => {
      await expect(access(path.join(projectRoot, 'backend/src/api/support.ts'))).rejects.toThrow();
      await expect(access(path.join(projectRoot, 'backend/src/admin/support.ts'))).rejects.toThrow();
    });
  });
});
