import { inject, Injectable } from '@angular/core';
import { MessageService, ToastMessageOptions } from 'primeng/api';
import { NotificationHandler } from '@ubax-workspace/shared-data-access';

type ToastSeverity = NonNullable<ToastMessageOptions['severity']>;

const TOAST_SUMMARY: Record<ToastSeverity, string> = {
  success: 'Operation reussie',
  info: 'Information',
  warn: 'Attention',
  error: 'Action impossible',
  secondary: 'Notification',
  contrast: 'Notification',
};

@Injectable({ providedIn: 'root' })
export class NotificationService implements NotificationHandler {
  private readonly ms = inject(MessageService);

  private push(severity: ToastSeverity, detail: string, life: number): void {
    const normalizedDetail =
      detail?.trim() || 'Une notification est disponible.';

    this.ms.add({
      severity,
      summary: TOAST_SUMMARY[severity],
      detail: normalizedDetail,
      life,
      closable: true,
      styleClass: `ubax-toast-message ubax-toast-message--${severity}`,
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
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
