import { expect, test } from '@playwright/test';
import { adminApiLogin, adminLogin, openAdminNavPage, settingsInput, type AdminSettingsPayload } from '../../helpers/adminUi';
import { apiGet, apiPatchRaw } from '../../helpers/api';

test.describe('admin ui / audit log', () => {
  test('shows audit log entries for representative admin mutations', async ({ page, request }) => {
    await test.step('Flow: shows audit log entries for representative admin mutations', async () => {
      test.setTimeout(90000);
      const token = await adminApiLogin(request);
      const original = await apiGet<AdminSettingsPayload>(request, '/api/admin/settings', token);

      try {
        await test.step('Create an admin settings audit entry via API', async () => {
          await apiPatchRaw(
            request,
            '/api/admin/settings',
            {
              ...settingsInput(original),
              server: { publicBaseUrl: `http://localhost:5174/?audit=${Date.now()}` },
            },
            token,
          );
        });

        await adminLogin(page);
        await test.step('Open admin audit log from navigation', async () => {
          await openAdminNavPage(page, { navItem: 'audit-log', url: /\/admin\/audit-log$/, view: 'admin-audit-log' });
        });
        await test.step('Verify admin audit log entry', async () => {
          await expect(page.getByTestId('admin-audit-log')).toContainText('app-settings', { timeout: 30000 });
        });
      } finally {
        await apiPatchRaw(request, '/api/admin/settings', settingsInput(original), token);
      }
    });
  });
});