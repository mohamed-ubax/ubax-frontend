import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

const SEVERITY_COLORS: Record<string, string> = {
  danger:  '#e7000b',
  warn:    '#e87d1e',
  info:    '#2b7fff',
  success: '#34c759',
};

@Component({
  selector: 'ubax-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .dlg-overlay {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; backdrop-filter: blur(6px); padding: 16px;
    }
    .dlg {
      border: none; margin: 0; position: relative;
      background: #ffffff;
      border-radius: 20px; padding: 28px 32px; width: 100%; max-width: 480px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 24px 64px rgba(15, 45, 94, 0.18);
      display: flex; flex-direction: column; gap: 20px;
    }
    .dlg__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .dlg__title {
      font-family: 'Lexend', sans-serif; font-size: 18px; font-weight: 700;
      color: #1a3047; margin: 0;
    }
    .dlg__close {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: #f5f8fb;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 0.15s;
    }
    .dlg__close:hover { background: #e2e8f0; }
    .dlg__close i { font-size: 13px; color: #6b7280; }
    .dlg__message {
      font-family: 'Lexend', sans-serif; font-size: 14px; font-weight: 300;
      color: #6b7280; line-height: 1.6; margin: 0;
    }
    .dlg__divider { width: 100%; height: 1px; background: #e2e8f0; }
    .dlg__actions { display: flex; gap: 12px; width: 100%; }
    .dlg__actions button { flex: 1; }
    .dlg-btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px; height: 44px; padding: 0 20px; border-radius: 12px;
      border: none; font-family: 'Lexend', sans-serif; font-size: 14px;
      font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .dlg-btn:hover { opacity: 0.88; }
    .dlg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .dlg-btn--ghost { background: #f5f8fb; color: #1a3047; border: 1px solid #e2e8f0; }
    .dlg-btn--primary { color: #ffffff; }
  `],
  template: `
    @if (visible()) {
      <div class="dlg-overlay" (click)="visibleChange.emit(false)">
        <dialog class="dlg" (click)="$event.stopPropagation()" open>

          <div class="dlg__header">
            <h2 class="dlg__title">{{ title() }}</h2>
            <button class="dlg__close" type="button" aria-label="Fermer" (click)="visibleChange.emit(false)">
              <i class="pi pi-times" aria-hidden="true"></i>
            </button>
          </div>

          <p class="dlg__message">{{ message() }}</p>

          <ng-content />

          <div class="dlg__divider" aria-hidden="true"></div>

          <div class="dlg__actions">
            <button
              class="dlg-btn dlg-btn--ghost"
              type="button"
              (click)="visibleChange.emit(false)"
              [disabled]="loading()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              class="dlg-btn dlg-btn--primary"
              type="button"
              [style.background]="confirmColor()"
              (click)="confirmed.emit()"
              [disabled]="loading()"
            >
              @if (loading()) {
                <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
              }
              {{ confirmLabel() }}
            </button>
          </div>

        </dialog>
      </div>
    }
  `,
})
export class ConfirmDialogComponent implements OnDestroy {
  private readonly doc = inject(DOCUMENT);

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

  protected readonly confirmColor = computed(() => SEVERITY_COLORS[this.confirmSeverity()] ?? '#e7000b');

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.doc.body.classList.add('ubax-overlay-open');
      } else {
        this.doc.body.classList.remove('ubax-overlay-open');
      }
    });
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }
}
