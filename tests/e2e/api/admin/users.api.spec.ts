import { expect, test } from '@playwright/test';
import type { NotificationDetailPayload } from '../../../../src/types/domain';
import { adminLogin, clearMailbox, latestMailFor } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, type AuthPayload, type NotificationsPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / users', () => {
  test('lists overview, users and couples without private text content and exports csv', async ({ request }) => {
    await test.step('Flow: lists overview, users and couples without private text content and exports csv', async () => {
      const runId = testRunId();
      const userA = testUser('admin-list-a', runId);
      const userB = testUser('admin-list-b', runId);
      const setup = await setupCoupleByApi(request, userA, userB);
      await apiPostRaw(request, '/api/today/answer', { answerText: 'private answer text' }, setup.partnerA.token);
      await apiPostRaw(request, '/api/love-jar', { text: 'private jar note one', category: 'compliment' }, setup.partnerA.token);
      await apiPostRaw(request, '/api/love-jar', { text: 'private jar note two', category: 'compliment' }, setup.partnerB.token);

      const token = await adminLogin(request);
      const overview = await apiGet<{ userCount: number; coupleCount: number; usesDefaultAdminPassword: boolean; }>(
        request,
        '/api/admin/overview',
        token,
      );
      await test.step('Verify expected result', async () => {
        expect(overview.userCount).toBeGreaterThan(0);
      });
      await test.step('Verify expected result', async () => {
        expect(overview.coupleCount).toBeGreaterThan(0);
      });
      await test.step('Verify expected result', async () => {
        expect(overview.usesDefaultAdminPassword).toBe(true);
      });

      const usersResponse = await apiGetRaw(request, `/api/admin/users?search=${encodeURIComponent(userA.email)}`, token);
      const usersPayload = await expectJson<{ items: unknown[]; }>(usersResponse);
      await test.step('Verify expected result', async () => {
        expect(JSON.stringify(usersPayload)).toContain(userA.email);
      });
      await test.step('Verify expected result', async () => {
        expect(JSON.stringify(usersPayload)).not.toContain('private answer text');
      });

      const injectedUsersResponse = await apiGetRaw(
        request,
        `/api/admin/users?search=${encodeURIComponent(`%' OR '1'='1`)}`,
        token,
      );
      const injectedUsersPayload = await expectJson<{ items: unknown[]; total: number; }>(injectedUsersResponse);
      await test.step('Verify expected result', async () => {
        expect(injectedUsersPayload.items).toHaveLength(0);
      });
      await test.step('Verify expected result', async () => {
        expect(injectedUsersPayload.total).toBe(0);
      });

      const couplesResponse = await apiGetRaw(request, `/api/admin/couples?search=${setup.inviteCode}`, token);
      const couplesPayload = await expectJson<{ items: Array<{ id: string; inviteCode: string; members: unknown[]; }>; }>(couplesResponse);
      await test.step('Verify expected result', async () => {
        expect(couplesPayload.items[0]?.inviteCode).toBe(setup.inviteCode);
      });
      await test.step('Verify expected result', async () => {
        expect(couplesPayload.items[0]?.members).toHaveLength(2);
      });
      await test.step('Verify expected result', async () => {
        expect(JSON.stringify(couplesPayload)).not.toContain('private answer text');
      });

      const injectedCouplesResponse = await apiGetRaw(
        request,
        `/api/admin/couples?search=${encodeURIComponent(`${setup.inviteCode}' OR true --`)}`,
        token,
      );
      const injectedCouplesPayload = await expectJson<{ items: unknown[]; total: number; }>(injectedCouplesResponse);
      await test.step('Verify expected result', async () => {
        expect(injectedCouplesPayload.items).toHaveLength(0);
      });
      await test.step('Verify expected result', async () => {
        expect(injectedCouplesPayload.total).toBe(0);
      });

      const detail = await apiGet<{ couple: { dailyAnswerCount: number; members: unknown[]; }; }>(
        request,
        `/api/admin/couples/${couplesPayload.items[0].id}`,
        token,
      );
      await test.step('Verify expected result', async () => {
        expect(detail.couple.dailyAnswerCount).toBeGreaterThanOrEqual(1);
      });
      await test.step('Verify expected result', async () => {
        expect(detail.couple.members).toHaveLength(2);
      });

      const csvResponse = await apiGetRaw(request, '/api/admin/users?format=csv', token);
      await test.step('Verify expected result', async () => {
        expect(csvResponse.ok()).toBe(true);
      });
      await test.step('Verify expected result', async () => {
        expect(csvResponse.headers()['content-type']).toContain('text/csv');
      });
      await test.step('Verify expected result', async () => {
        expect(await csvResponse.text()).toContain('email');
      });
    });
  });

  test('sets a user password and creates account notifications', async ({ request }) => {
    await test.step('Flow: sets a user password and creates account notifications', async () => {
      const runId = testRunId();
      const user = testUser('admin-password-reset', runId);
      const registered = await registerByApi(request, user);
      const adminToken = await adminLogin(request);
      const nextPassword = `Admin-reset-${runId}`;
      await clearMailbox(request);

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/admin/users/${registered.user.id}/password`, { password: 'short' }, adminToken),
          400,
          'common.validation',
        );
      });

      const resetResponse = await expectJson<{ user: { id: string; email: string; displayName: string; }; }>(
        await apiPostRaw(request, `/api/admin/users/${registered.user.id}/password`, { password: nextPassword }, adminToken),
      );
      await test.step('Verify expected result', async () => {
        expect(resetResponse.user).toEqual(
          expect.objectContaining({
            id: registered.user.id,
            email: user.email,
            displayName: user.displayName,
          }),
        );
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/login', { email: user.email, password: user.password }),
          401,
          'auth.invalidCredentials',
        );
      });
      const loginPayload = await expectJson<AuthPayload>(
        await apiPostRaw(request, '/api/auth/login', { email: user.email, password: nextPassword }),
      );
      await test.step('Verify expected result', async () => {
        expect(loginPayload.user.id).toBe(registered.user.id);
      });

      const notifications = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', loginPayload.token));
      const notification = notifications.notifications.find((item) => String(item.type) === 'admin_password_reset');
      await test.step('Verify expected result', async () => {
        expect(notification).toEqual(
          expect.objectContaining({
            coupleId: null,
            titleKey: 'notifications.titles.adminPasswordReset',
            bodyKey: 'notifications.bodies.adminPasswordReset',
            sourceType: 'account',
            sourceId: registered.user.id,
            readAt: null,
          }),
        );
      });
      await test.step('Verify expected result', async () => {
        expect(notification!.title).toContain('Passwort');
      });
      await test.step('Verify expected result', async () => {
        expect(notification!.body).toContain('Administrator');
      });

      const detail = await expectJson<NotificationDetailPayload>(
        await apiGetRaw(request, `/api/notifications/${notification!.id}/detail`, loginPayload.token),
      );
      await test.step('Verify expected result', async () => {
        expect(detail.targetPageId).toBe('settings');
      });
      await test.step('Verify expected result', async () => {
        expect(detail.gardenDetail).toBeNull();
      });

      const mail = await latestMailFor(request, user.email);
      await test.step('Verify expected result', async () => {
        expect(mail.subject).toBe('Dein Herzgarten-Passwort wurde neu gesetzt');
      });
      await test.step('Verify expected result', async () => {
        expect(mail.text).toContain(`Hallo ${user.displayName}`);
      });
      await test.step('Verify expected result', async () => {
        expect(mail.text).toContain('dein Herzgarten-Passwort wurde durch einen Administrator neu gesetzt');
      });
      await test.step('Verify expected result', async () => {
        expect(mail.text).toContain('enthält diese E-Mail kein Passwort');
      });
      await test.step('Verify expected result', async () => {
        expect(mail.text).not.toContain(nextPassword);
      });
    });
  });
});
