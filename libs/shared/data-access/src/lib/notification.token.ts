import { InjectionToken } from '@angular/core';

export type NotificationHandler = {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
};

export const NOTIFICATION_HANDLER = new InjectionToken<NotificationHandler>(
  'NOTIFICATION_HANDLER',
);
