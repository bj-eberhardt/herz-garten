import { test, type APIResponse } from '@playwright/test';

import { apiPostRaw, createCoupleByApi, joinCoupleByApi, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / pairing', () => {
  test('rejects unauthenticated pairing access', async ({ request }) => {
    await test.step('Reject: create couple without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples', {}), 401, 'auth.missingToken');
    });

    await test.step('Reject: join couple without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples/join', { inviteCode: 'apfel-sonne-0000' }), 401, 'auth.missingToken');
    });

    await test.step('Reject: leave couple without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples/leave', {}), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid pairing tokens', async ({ request }) => {
    await test.step('Reject: create couple with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples', {}, 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: join couple with invalid auth token', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/couples/join', { inviteCode: 'apfel-sonne-0000' }, 'invalid-token'),
        401,
        'auth.invalidToken',
      );
    });

    await test.step('Reject: leave couple with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples/leave', {}, 'invalid-token'), 401, 'auth.invalidToken');
    });
  });

  test('rejects unexpected query parameters on pairing routes', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-pairing-query', testRunId()));

    await test.step('Reject: create couple with unexpected query parameter', async () => {
      await expectRejected(await apiPostRaw(request, '/api/couples?unexpected=true', {}, user.token));
    });

    await test.step('Reject: join couple with unexpected query parameter', async () => {
      await expectRejected(await apiPostRaw(request, '/api/couples/join?unexpected=true', { inviteCode: 'apfel-sonne-0000' }, user.token));
    });

    await test.step('Reject: leave couple with unexpected query parameter', async () => {
      await expectRejected(await apiPostRaw(request, '/api/couples/leave?unexpected=true', {}, user.token));
    });
  });

  test('rejects invalid pairing payload shapes and values', async ({ request }) => {
    const runId = testRunId();
    const owner = await registerByApi(request, testUser('api-pairing-invalid-owner', runId));
    const joiner = await registerByApi(request, testUser('api-pairing-invalid-joiner', runId));
    const couple = await createCoupleByApi(request, owner.token);

    const invalidCreatePayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown field', body: { relationshipType: 'mixed', contentPreference: 'balanced', extra: true } },
      { name: 'numeric relationship type', body: { relationshipType: 123, contentPreference: 'balanced' } },
      { name: 'numeric content preference', body: { relationshipType: 'mixed', contentPreference: 123 } },
      { name: 'unknown relationship type', body: { relationshipType: 'missing_relationship', contentPreference: 'balanced' } },
      { name: 'unknown content preference', body: { relationshipType: 'mixed', contentPreference: 'missing_style' } },
    ];

    for (const { name, body } of invalidCreatePayloads) {
      const user = await registerByApi(request, testUser(`api-pairing-create-${name.replace(/\W+/g, '-')}`, runId));
      await test.step(`Reject: create couple payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/couples', body, user.token));
      });
    }

    const invalidJoinPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown field', body: { inviteCode: couple.couple.inviteCode, extra: true } },
      { name: 'missing invite code', body: {} },
      { name: 'blank invite code', body: { inviteCode: '   ' } },
      { name: 'numeric invite code', body: { inviteCode: 123 } },
    ];

    for (const { name, body } of invalidJoinPayloads) {
      await test.step(`Reject: join couple payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/couples/join', body, joiner.token));
      });
    }

    await test.step('Reject: leave couple request with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, '/api/couples/leave', { unexpected: true }, joiner.token));
    });
  });

  test('rejects duplicate couple creation and already-connected joins', async ({ request }) => {
    const runId = testRunId();
    const userA = testUser('api-couple-conflict-a', runId);
    const userB = testUser('api-couple-conflict-b', runId);
    const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);

    await test.step('Reject: connected user cannot create another couple', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples', {}, partnerA.token), 409, 'couple.alreadyConnected');
    });

    await test.step('Reject: connected user cannot join another couple', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/couples/join', { inviteCode: 'apfel-sonne-0000' }, partnerB.token),
        409,
        'couple.alreadyConnected',
      );
    });
  });

  test('rejects unknown and full invite codes with domain error keys', async ({ request }) => {
    const runId = testRunId();
    const owner = await registerByApi(request, testUser('api-invite-owner', runId));
    const partner = await registerByApi(request, testUser('api-invite-partner', runId));
    const third = await registerByApi(request, testUser('api-invite-third', runId));
    const lonely = await registerByApi(request, testUser('api-invite-lonely', runId));
    const couple = await createCoupleByApi(request, owner.token);

    await test.step('Reject: unknown invite code keeps not-found domain error', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/couples/join', { inviteCode: 'apfel-sonne-0000' }, lonely.token),
        404,
        'couple.inviteCodeNotFound',
      );
    });

    await test.step('Setup: second user joins the invite', async () => {
      await joinCoupleByApi(request, partner.token, couple.couple.inviteCode);
    });

    await test.step('Reject: third user cannot join full couple', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/couples/join', { inviteCode: couple.couple.inviteCode }, third.token),
        409,
        'couple.full',
      );
    });
  });

  test('rejects leave without a couple', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-no-couple-leave', testRunId()));

    await test.step('Reject: user without couple cannot leave one', async () => {
      await expectApiError(await apiPostRaw(request, '/api/couples/leave', {}, user.token), 409, 'couple.notConnected');
    });
  });
});