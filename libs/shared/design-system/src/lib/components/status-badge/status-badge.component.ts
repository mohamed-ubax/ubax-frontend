import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusVariant =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'active'
  | 'suspended'
  | 'available'
  | 'unavailable'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  confirmed:   'bg-success-bg text-success',
  pending:     'bg-warning-bg text-warning',
  cancelled:   'bg-danger-bg text-danger',
  active:      'bg-success-bg text-success',
  suspended:   'bg-danger-bg text-danger',
  available:   'bg-success-bg text-success',
  unavailable: 'bg-neutral-100 text-neutral-500',
  success:     'bg-success-bg text-success',
  warning:     'bg-warning-bg text-warning',
  danger:      'bg-danger-bg text-danger',
  info:        'bg-info-bg text-info',
  neutral:     'bg-neutral-100 text-neutral-500',
};

/**
 * UbaxStatusBadge — Status indicator badge
 *
 * Usage:
 * ```html
 * <ubax-status-badge variant="confirmed">Confirmé</ubax-status-badge>
 * <ubax-status-badge variant="pending">En attente</ubax-status-badge>
 * <ubax-status-badge variant="cancelled">Annulée</ubax-status-badge>
 * ```
 */
@Component({
  selector: 'ubax-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center justify-center rounded-xs px-2 py-0.5 text-base font-regular leading-5"
      [ngClass]="variantClasses()"
    >
      <ng-content />
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly variant = input<StatusVariant>('neutral');

  readonly variantClasses = computed(() => VARIANT_CLASSES[this.variant()]);
}
