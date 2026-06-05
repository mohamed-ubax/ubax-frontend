import { Injectable, signal } from '@angular/core';
import { NotificationHandler } from '@ubax-workspace/shared-data-access';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface AdminNotification {
  id: number;
  severity: ToastSeverity;
  title: string;
  detail: string;
}

const TOAST_SUMMARY: Record<ToastSeverity, string> = {
  success: 'Operation reussie',
  info: 'Information',
  warn: 'Attention',
  error: 'Action impossible',
};

@Injectable({ providedIn: 'root' })
export class NotificationService implements NotificationHandler {
  private nextId = 0;
  readonly notifications = signal<AdminNotification[]>([]);

  private push(severity: ToastSeverity, detail: string, life: number): void {
    const normalizedDetail =
      detail?.trim() || 'Une notification est disponible.';
    const id = ++this.nextId;
    const entry: AdminNotification = {
      id,
      severity,
      title: TOAST_SUMMARY[severity],
      detail: normalizedDetail,
    };

    this.notifications.update((current) => [...current, entry]);

    globalThis.setTimeout(() => {
      this.dismiss(id);
    }, life);
  }

  dismiss(id: number): void {
    this.notifications.update((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }

  success(message: string): void {
    this.push('success', message, 4200);
  }

  error(message: string): void {
    this.push('error', message, 6200);
  }

  info(message: string): void {
    this.push('info', message, 4200);
  }
}
