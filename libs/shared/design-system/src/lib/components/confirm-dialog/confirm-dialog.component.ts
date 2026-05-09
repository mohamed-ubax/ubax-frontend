import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

/**
 * UbaxConfirmDialog — Confirmation modal matching Figma dialog patterns
 *
 * Usage:
 * ```html
 * <ubax-confirm-dialog
 *   [(visible)]="showConfirm"
 *   title="Confirmer la suppression"
 *   message="Cette action est irréversible."
 *   confirmLabel="Supprimer"
 *   confirmSeverity="danger"
 *   (confirmed)="onDelete()"
 * />
 * ```
 */
@Component({
  selector: 'ubax-confirm-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '480px' }"
      styleClass="ubax-dialog"
    >
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          @if (icon()) {
            <div
              class="flex items-center justify-center size-10 rounded-full"
              [class.bg-danger-bg]="confirmSeverity() === 'danger'"
              [class.bg-warning-bg]="confirmSeverity() === 'warn'"
              [class.bg-info-bg]="confirmSeverity() === 'info'"
            >
              <i
                [class]="icon()"
                [class.text-danger]="confirmSeverity() === 'danger'"
                [class.text-warning]="confirmSeverity() === 'warn'"
                [class.text-info]="confirmSeverity() === 'info'"
              ></i>
            </div>
          }
          <span class="text-3xl font-semibold text-brand-navy">
            {{ title() }}
          </span>
        </div>
      </ng-template>

      <p class="text-md font-regular text-neutral-600 leading-relaxed">
        {{ message() }}
      </p>

      <ng-content />

      <ng-template pTemplate="footer">
        <div class="flex items-center justify-end gap-3">
          <p-button
            [label]="cancelLabel()"
            severity="secondary"
            (onClick)="visibleChange.emit(false)"
          />
          <p-button
            [label]="confirmLabel()"
            [severity]="confirmSeverity()"
            [loading]="loading()"
            (onClick)="confirmed.emit()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class ConfirmDialogComponent {
  readonly visible         = input<boolean>(false);
  readonly title           = input<string>('Confirmer');
  readonly message         = input<string>('Êtes-vous sûr de vouloir continuer ?');
  readonly icon            = input<string>();
  readonly confirmLabel    = input<string>('Confirmer');
  readonly cancelLabel     = input<string>('Annuler');
  readonly confirmSeverity = input<'danger' | 'warn' | 'info' | 'success'>('danger');
  readonly loading         = input<boolean>(false);

  readonly visibleChange = output<boolean>();
  readonly confirmed     = output<void>();
}
