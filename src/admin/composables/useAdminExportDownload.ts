import { adminDownloadUrl, getAdminToken } from '@/admin/services/adminApi';

export function useAdminExportDownload(baseFileName: string) {
  async function download(path: string, format: 'json' | 'csv') {
    const response = await fetch(adminDownloadUrl(path), {
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseFileName}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { download };
}
