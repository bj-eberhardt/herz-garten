import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGetRaw, apiPost, apiPostRaw, registerByApi } from '../../helpers/api';
import { expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / couples', () => {
  test('lists a one-member couple once even when joined content creates many rows', async ({ request }) => {
    await test.step('Flow: lists a one-member couple once even when joined content creates many rows', async () => {
      const runId = testRunId();
      const owner = await registerByApi(request, testUser('admin-one-member-couple', runId));
      const couple = await apiPost<{ couple: { id: string; inviteCode: string; memberCount: number; }; }>(
        request,
        '/api/couples',
        { relationshipType: 'mixed', contentPreference: 'balanced' },
        owner.token,
      );
      await apiPostRaw(request, '/api/today/answer', { answerText: 'private one-member answer' }, owner.token);
      await apiPostRaw(request, '/api/love-jar', { text: 'private one-member note one', category: 'compliment' }, owner.token);
      await apiPostRaw(request, '/api/love-jar', { text: 'private one-member note two', category: 'compliment' }, owner.token);
      await expectJson(
        await apiPostRaw(
          request,
          '/api/know-me',
          {
            questionText: 'Welche Farbe mag ich gerade?',
            options: ['Gruen', 'Blau'],
            correctOptionIndex: 0,
          },
          owner.token,
        ),
        201,
      );

      const token = await adminLogin(request);
      const couplesResponse = await apiGetRaw(request, `/api/admin/couples?search=${couple.couple.inviteCode}`, token);
      const payload = await expectJson<{
        items: Array<{
          id: string;
          inviteCode: string;
          members: Array<{ email: string; }>;
          dailyAnswerCount: number;
          loveJarNoteCount: number;
          knowMeRoundCount: number;
        }>;
      }>(couplesResponse);

      await test.step('Verify expected result', async () => {
        expect(payload.items).toHaveLength(1);
      });
      await test.step('Verify expected result', async () => {
        expect(payload.items[0]).toEqual(
          expect.objectContaining({
            id: couple.couple.id,
            inviteCode: couple.couple.inviteCode,
            dailyAnswerCount: 1,
            loveJarNoteCount: 2,
            knowMeRoundCount: 0,
          }),
        );
      });
      await test.step('Verify expected result', async () => {
        expect(payload.items[0].members).toHaveLength(1);
      });
      await test.step('Verify expected result', async () => {
        expect(payload.items[0].members[0].email).toBe(owner.user.email);
      });
      await test.step('Verify expected result', async () => {
        expect(JSON.stringify(payload)).not.toContain('private one-member answer');
      });
      await test.step('Verify expected result', async () => {
        expect(JSON.stringify(payload)).not.toContain('private one-member note');
      });
    });
  });
});
