import { expect, test } from '@playwright/test';
import { adminLogin, apiBaseURL, pngHeader } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId } from '../../helpers/testUsers';

interface GardenAssetItem {
  key: string;
  label: string;
  image: string;
  width: number;
  height: number;
  sourceTypes: string[];
  stageUnlock: number;
  anchorX: number;
  anchorY: number;
  active: boolean;
  sortOrder: number;
}

type MultipartValue = string | { name: string; mimeType: string; buffer: Buffer };

type MultipartPayload = Record<string, MultipartValue>;

function uniqueAssetKey(prefix = 'asset') {
  return `${prefix}_${testRunId().replaceAll('-', '_')}`;
}

function validAssetMultipart(
  key: string,
  overrides: Record<string, MultipartValue | undefined> = {},
  options: { includeImage?: boolean; image?: { name: string; mimeType: string; buffer: Buffer } } = {},
) {
  const multipart: MultipartPayload = {
    key,
    label: 'Uploaded asset',
    sourceTypes: JSON.stringify(['quest']),
    stageUnlock: '1',
    anchorX: '0.5',
    anchorY: '0.9',
    active: 'true',
    sortOrder: '999',
  };

  for (const [field, value] of Object.entries(overrides)) {
    if (value === undefined) delete multipart[field];
    else multipart[field] = value;
  }

  if (options.includeImage !== false) {
    multipart.image = options.image ?? {
      name: 'asset.png',
      mimeType: 'image/png',
      buffer: pngHeader(64, 80),
    };
  }

  return multipart;
}

function validPatchMultipart(overrides: Record<string, MultipartValue | undefined> = {}, options: { image?: { name: string; mimeType: string; buffer: Buffer } } = {}) {
  const multipart = validAssetMultipart('ignored_patch_key', { key: undefined, ...overrides }, { includeImage: false });
  if (options.image) multipart.image = options.image;
  return multipart;
}


test.describe('admin api / garden assets', () => {
  test('manages garden assets with uploaded images', async ({ request }) => {
    await test.step('Flow: manages garden assets with uploaded images', async () => {
      const token = await adminLogin(request);
      const key = uniqueAssetKey();

      const listed = await apiGet<{ items: GardenAssetItem[] }>(request, '/api/admin/garden/assets', token);
      expect(listed.items.some((item) => item.key === 'conversation_flower')).toBeTruthy();

      const missingImage = await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
        multipart: validAssetMultipart(uniqueAssetKey('missing_image'), {}, { includeImage: false }),
        headers: { Authorization: `Bearer ${token}` },
      });
      await expectApiError(missingImage, 400, 'admin.gardenAsset.imageRequired');

      const created = await expectJson<{ item: GardenAssetItem }>(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: validAssetMultipart(key),
          headers: { Authorization: `Bearer ${token}` },
        }),
        201,
      );
      expect(created.item).toMatchObject({
        key,
        image: expect.stringMatching(/^\/uploads\/garden-assets\//),
        width: 64,
        height: 80,
        sourceTypes: ['quest'],
        stageUnlock: 1,
        anchorX: 0.5,
        anchorY: 0.9,
        active: true,
        sortOrder: 999,
      });

      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: validAssetMultipart(key),
          headers: { Authorization: `Bearer ${token}` },
        }),
        409,
        'admin.gardenAsset.keyExists',
      );

      const updated = await expectJson<{ item: GardenAssetItem }>(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/${key}`, {
          multipart: validPatchMultipart({
            label: 'Inactive uploaded asset',
            sourceTypes: JSON.stringify(['quest', 'memory']),
            anchorX: '0.25',
            anchorY: '0.75',
            active: 'false',
            sortOrder: '-5',
          }),
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      expect(updated.item).toMatchObject({
        key,
        label: 'Inactive uploaded asset',
        sourceTypes: ['quest', 'memory'],
        anchorX: 0.25,
        anchorY: 0.75,
        active: false,
        sortOrder: -5,
        width: 64,
        height: 80,
      });

      const imageUpdated = await expectJson<{ item: GardenAssetItem }>(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/${key}`, {
          multipart: validPatchMultipart(
            { label: 'Image updated asset', active: 'true', sortOrder: '7' },
            { image: { name: 'asset-next.png', mimeType: 'image/png', buffer: pngHeader(32, 48) } },
          ),
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      expect(imageUpdated.item).toMatchObject({ key, label: 'Image updated asset', width: 32, height: 48, active: true, sortOrder: 7 });
    });
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);
    const key = uniqueAssetKey('query');

    await test.step('Reject missing and invalid auth', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/garden/assets'), 401, 'auth.missingToken');
      await expectApiError(await apiGetRaw(request, '/api/admin/garden/assets', 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, { multipart: validAssetMultipart(key) }),
        401,
        'auth.missingToken',
      );
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: validAssetMultipart(key),
          headers: { Authorization: 'Bearer not-a-token' },
        }),
        401,
        'auth.invalidToken',
      );
      await expectApiError(await apiPatchRaw(request, '/api/admin/garden/assets/conversation_flower', {}, undefined), 401, 'auth.missingToken');
      await expectApiError(await apiPatchRaw(request, '/api/admin/garden/assets/conversation_flower', {}, 'not-a-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject unknown query parameters', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/garden/assets?unexpected=true', token), 400, 'common.validation');
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/assets?unexpected=true`, {
          multipart: validAssetMultipart(uniqueAssetKey('query_post')),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'common.validation',
      );
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/conversation_flower?unexpected=true`, {
          multipart: validPatchMultipart(),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'common.validation',
      );
    });
  });

  test('rejects invalid garden asset create payloads and images', async ({ request }) => {
    const token = await adminLogin(request);

    await test.step('Reject invalid keys', async () => {
      for (const key of [undefined, ' ', 'Asset-1', 'asset.test', 'asset test']) {
        await expectApiError(
          await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
            multipart: validAssetMultipart(key ?? uniqueAssetKey('bad_key'), key === undefined ? { key: undefined } : {}, { includeImage: true }),
            headers: { Authorization: `Bearer ${token}` },
          }),
          400,
          'admin.gardenAsset.keyInvalid',
        );
      }
    });

    const invalidPayloads: Array<{ name: string; overrides: Record<string, MultipartValue | undefined> }> = [
      { name: 'missing label', overrides: { label: undefined } },
      { name: 'empty label', overrides: { label: ' ' } },
      { name: 'missing sourceTypes', overrides: { sourceTypes: undefined } },
      { name: 'broken sourceTypes', overrides: { sourceTypes: 'not-json' } },
      { name: 'empty sourceTypes', overrides: { sourceTypes: JSON.stringify([]) } },
      { name: 'unknown sourceTypes', overrides: { sourceTypes: JSON.stringify(['unknown']) } },
      { name: 'missing stageUnlock', overrides: { stageUnlock: undefined } },
      { name: 'zero stageUnlock', overrides: { stageUnlock: '0' } },
      { name: 'decimal stageUnlock', overrides: { stageUnlock: '1.5' } },
      { name: 'invalid stageUnlock', overrides: { stageUnlock: 'abc' } },
      { name: 'missing anchorX', overrides: { anchorX: undefined } },
      { name: 'low anchorX', overrides: { anchorX: '-0.1' } },
      { name: 'high anchorX', overrides: { anchorX: '1.1' } },
      { name: 'invalid anchorX', overrides: { anchorX: 'abc' } },
      { name: 'missing anchorY', overrides: { anchorY: undefined } },
      { name: 'low anchorY', overrides: { anchorY: '-0.1' } },
      { name: 'high anchorY', overrides: { anchorY: '1.1' } },
      { name: 'invalid anchorY', overrides: { anchorY: 'abc' } },
      { name: 'missing active', overrides: { active: undefined } },
      { name: 'invalid active', overrides: { active: 'yes' } },
      { name: 'decimal sortOrder', overrides: { sortOrder: '1.5' } },
      { name: 'invalid sortOrder', overrides: { sortOrder: 'abc' } },
    ];

    await test.step('Reject invalid payload fields', async () => {
      for (const invalid of invalidPayloads) {
        await expectApiError(
          await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
            multipart: validAssetMultipart(uniqueAssetKey('invalid_create'), invalid.overrides),
            headers: { Authorization: `Bearer ${token}` },
          }),
          400,
          'common.validation',
        );
      }
    });

    await test.step('Reject invalid uploaded images', async () => {
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: validAssetMultipart(uniqueAssetKey('bad_mime'), {}, {
            image: { name: 'asset.txt', mimeType: 'text/plain', buffer: Buffer.from('plain text') },
          }),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'admin.upload.invalidImage',
      );
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: validAssetMultipart(uniqueAssetKey('bad_image'), {}, {
            image: { name: 'asset.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
          }),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'admin.upload.invalidImage',
      );
    });
  });

  test('rejects invalid garden asset patch payloads and images', async ({ request }) => {
    const token = await adminLogin(request);
    const key = uniqueAssetKey('patch');
    await expectJson(
      await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
        multipart: validAssetMultipart(key),
        headers: { Authorization: `Bearer ${token}` },
      }),
      201,
    );

    await test.step('Reject unknown patch key', async () => {
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/not_existing_asset`, {
          multipart: validPatchMultipart(),
          headers: { Authorization: `Bearer ${token}` },
        }),
        404,
        'admin.gardenAsset.notFound',
      );
    });

    for (const overrides of [
      { label: undefined },
      { label: ' ' },
      { sourceTypes: undefined },
      { sourceTypes: 'not-json' },
      { sourceTypes: JSON.stringify([]) },
      { sourceTypes: JSON.stringify(['unknown']) },
      { stageUnlock: undefined },
      { stageUnlock: '0' },
      { stageUnlock: '1.5' },
      { anchorX: undefined },
      { anchorX: '-0.1' },
      { anchorX: '1.1' },
      { anchorY: undefined },
      { anchorY: '-0.1' },
      { anchorY: '1.1' },
      { active: undefined },
      { active: 'yes' },
      { sortOrder: 'abc' },
    ] satisfies Array<Record<string, MultipartValue | undefined>>) {
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/${key}`, {
          multipart: validPatchMultipart(overrides),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'common.validation',
      );
    }

    await test.step('Reject invalid optional image upload', async () => {
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/${key}`, {
          multipart: validPatchMultipart({}, { image: { name: 'asset.png', mimeType: 'image/png', buffer: Buffer.from('not an image') } }),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'admin.upload.invalidImage',
      );
    });
  });
});