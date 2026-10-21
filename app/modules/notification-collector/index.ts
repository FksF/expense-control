import NotificationCollector from './src/NotificationCollectorModule';
import type { CaptureRecord } from './src/NotificationCollector.types';

export type { CaptureRecord };

/** Módulo nativo solo-Android; null en iOS/web/Expo Go. */
export const isSupported = NotificationCollector != null;

export function isGranted(): boolean {
  return NotificationCollector?.isGranted() ?? false;
}

export function openListenerSettings(): void {
  NotificationCollector?.openListenerSettings();
}

export async function listCaptures(): Promise<CaptureRecord[]> {
  const raw = await NotificationCollector?.readCaptures();
  if (!raw) return [];
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as CaptureRecord);
}

export async function clearCaptures(): Promise<void> {
  await NotificationCollector?.clearCaptures();
}

export function captureFilePath(): string | null {
  const p = NotificationCollector?.captureFilePath();
  return p ? `file://${p}` : null;
}
