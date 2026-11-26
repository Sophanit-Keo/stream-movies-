import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

/**
 * Opens a link outside the app. On Android this goes through the system, so a
 * Netflix or Prime Video link opens in that app when it is installed.
 */
export async function openExternal(url: string) {
  if (isNative) {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      const { completed } = await AppLauncher.openUrl({ url });
      if (completed) return;
    } catch {
      /* fall through to the WebView's own handling */
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
