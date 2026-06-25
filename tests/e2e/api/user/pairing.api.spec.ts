import { test } from '@playwright/test';

import {
  apiPostRaw,

  createCoupleByApi,

  joinCoupleByApi,

  registerByApi,

  setupCoupleByApi
} from '../../helpers/api';

import {
  expectApiError
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / pairing', () => {
  test('rejects duplicate couple creation and already-connected joins', async ({ request }) => {
    await test.step('Flow: rejects duplicate couple creation and already-connected joins', async () => {
      const runId = testRunId();
      const userA = testUser('api-couple-conflict-a', runId);
      const userB = testUser('api-couple-conflict-b', runId);
      const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/couples', {}, partnerA.token), 409, 'couple.alreadyConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/couples/join', { inviteCode: 'apfel-sonne-0000' }, partnerB.token),
          409,
          'couple.alreadyConnected',
        );
      });
    });
  });

  test('rejects missing unknown and full invite codes', async ({ request }) => {
    await test.step('Flow: rejects missing unknown and full invite codes', async () => {
      const runId = testRunId();
      const owner = await registerByApi(request, testUser('api-invite-owner', runId));
      const partner = await registerByApi(request, testUser('api-invite-partner', runId));
      const third = await registerByApi(request, testUser('api-invite-third', runId));
      const lonely = await registerByApi(request, testUser('api-invite-lonely', runId));
      const couple = await createCoupleByApi(request, owner.token);

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/couples/join', {}, lonely.token), 400, 'couple.inviteCodeRequired');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/couples/join', { inviteCode: 'apfel-sonne-0000' }, lonely.token),
          404,
          'couple.inviteCodeNotFound',
        );
      });

      await joinCoupleByApi(request, partner.token, couple.couple.inviteCode);
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/couples/join', { inviteCode: couple.couple.inviteCode }, third.token),
          409,
          'couple.full',
        );
      });
    });
  });

  test('rejects leave without a couple', async ({ request }) => {
    await test.step('Flow: rejects leave without a couple', async () => {
      const user = await registerByApi(request, testUser('api-no-couple-leave', testRunId()));

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/couples/leave', {}, user.token), 409, 'couple.notConnected');
      });
    });
  });
});
