// Una notificación capturada por ExpenseNotificationListenerService (JSONL).
export interface CaptureRecord {
  packageName: string;
  postTime: number;
  receivedAt: number;
  key?: string;
  groupKey?: string | null;
  isOngoing?: boolean;
  isClearable?: boolean;
  title?: string | null;
  text?: string | null;
  bigText?: string | null;
  subText?: string | null;
  infoText?: string | null;
  summaryText?: string | null;
  titleBig?: string | null;
  textLines?: (string | null)[];
}

export interface NotificationCollectorSpec {
  isGranted(): boolean;
  openListenerSettings(): void;
  readCaptures(): Promise<string>;
  clearCaptures(): Promise<void>;
  captureFilePath(): string;
}
