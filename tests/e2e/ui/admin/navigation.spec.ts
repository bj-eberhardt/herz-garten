import { test } from '@playwright/test';
import { adminLogin, openAdminNavPage, type AdminNavTarget } from '../../helpers/adminUi';

interface LabeledAdminNavTarget extends AdminNavTarget {
  label: string;
}

const adminNavTargets: LabeledAdminNavTarget[] = [
  { navItem: 'users', label: 'users', url: /\/admin\/users$/, view: 'admin-users' },
  { navItem: 'couples', label: 'couples', url: /\/admin\/couples$/, view: 'admin-couples' },
  { navItem: 'content', label: 'content', url: /\/admin\/content$/, view: 'admin-content' },
  { navItem: 'garden', label: 'garden', url: /\/admin\/garden$/, view: 'admin-garden' },
  { navItem: 'garden-assets', label: 'garden assets', url: /\/admin\/garden-assets$/, view: 'admin-garden-assets' },
  { navItem: 'categories', label: 'categories', url: /\/admin\/categories$/, view: 'admin-categories' },
  { navItem: 'taxonomies', label: 'taxonomies', url: /\/admin\/taxonomies$/, view: 'admin-taxonomies' },
  { navItem: 'messages', label: 'message templates', url: /\/admin\/messages$/, view: 'admin-message-templates' },
  { navItem: 'settings', label: 'settings', url: /\/admin\/settings$/, view: 'admin-settings' },
  { navItem: 'audit-log', label: 'audit log', url: /\/admin\/audit-log$/, view: 'admin-audit-log' },
  { navItem: 'dashboard', label: 'dashboard', url: /\/admin$/, view: 'admin-dashboard' },
];

test.describe('admin ui / navigation', () => {
  test('opens every admin page from the sidebar navigation', async ({ page }) => {
    await test.step('Flow: opens every admin page from the sidebar navigation', async () => {
      test.setTimeout(180000);

      await test.step('Login through admin UI', async () => {
        await adminLogin(page);
      });

      for (const target of adminNavTargets) {
        await test.step(`Open admin ${target.label} page from navigation`, async () => {
          await openAdminNavPage(page, target);
        });
      }
    });
  });
});