import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NotificationHandler } from '@ubax-workspace/shared-data-access';

@Injectable({ providedIn: 'root' })
export class NotificationService implements NotificationHandler {
  private readonly ms = inject(MessageService);

  success(message: string): void {
    this.ms.add({ severity: 'success', detail: message, life: 4000 });
  }

  error(message: string): void {
    this.ms.add({ severity: 'error', detail: message, life: 6000 });
  }

  info(message: string): void {
    this.ms.add({ severity: 'info', detail: message, life: 4000 });
  }
}
