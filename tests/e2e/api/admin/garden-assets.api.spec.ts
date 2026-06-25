import { expect, test } from '@playwright/test';
import { adminLogin, apiBaseURL, pngHeader } from '../../helpers/adminApi';
import { apiGet } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId } from '../../helpers/testUsers';

test.describe('admin api / garden assets', () => {
  test('manages garden assets with uploaded images', async ({ request }) => {
    await test.step('Flow: manages garden assets with uploaded images', async () => {
      const token = await adminLogin(request);
      const key = `asset_${testRunId().replaceAll('-', '_')}`;

      const listed = await apiGet<{ items: Array<{ key: string; image: string; active: boolean; }>; }>(request, '/api/admin/garden/assets', token);
      await test.step('Verify expected result', async () => {
        expect(listed.items.some((item) => item.key === 'conversation_flower')).toBeTruthy();
      });

      const missingImage = await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
        multipart: {
          key,
          label: 'Missing image',
          sourceTypes: JSON.stringify(['quest']),
          stageUnlock: '1',
          anchorX: '0.5',
          anchorY: '0.9',
          active: 'true',
          sortOrder: '999',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(missingImage, 400, 'admin.gardenAsset.imageRequired');
      });

      const created = await expectJson<{ item: { key: string; image: string; width: number; height: number; active: boolean; }; }>(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: {
            key,
            label: 'Uploaded asset',
            sourceTypes: JSON.stringify(['quest']),
            stageUnlock: '1',
            anchorX: '0.5',
            anchorY: '0.9',
            active: 'true',
            sortOrder: '999',
            image: {
              name: 'asset.png',
              mimeType: 'image/png',
              buffer: pngHeader(64, 80),
            },
          },
          headers: { Authorization: `Bearer ${token}` },
        }),
        201,
      );
      await test.step('Verify expected result', async () => {
        expect(created.item).toMatchObject({ key, image: expect.stringMatching(/^\/uploads\/garden-assets\//), width: 64, height: 80 });
      });

      const updated = await expectJson<{ item: { key: string; active: boolean; label: string; }; }>(
        await request.patch(`${apiBaseURL}/api/admin/garden/assets/${key}`, {
          multipart: {
            label: 'Inactive uploaded asset',
            sourceTypes: JSON.stringify(['quest']),
            stageUnlock: '1',
            anchorX: '0.5',
            anchorY: '0.9',
            active: 'false',
            sortOrder: '999',
          },
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      await test.step('Verify expected result', async () => {
        expect(updated.item).toMatchObject({ key, active: false, label: 'Inactive uploaded asset' });
      });
    });
  });
});
