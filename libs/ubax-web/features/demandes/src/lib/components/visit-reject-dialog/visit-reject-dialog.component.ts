import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { RejectVisitRequestDto } from '@ubax-workspace/shared-api-types';
import type { VisitRequest } from '@ubax-workspace/ubax-web-data-access';

@Component({
  selector: 'ubax-visit-reject-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-reject-dialog.component.html',
  styleUrl: './visit-reject-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onDismiss()' },
})
export class VisitRejectDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly visit = input.required<VisitRequest>();
  readonly loading = input<boolean>(false);

  readonly rejected = output<RejectVisitRequestDto>();
  readonly dismissed = output<void>();

  readonly reason = signal('');

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.onDismiss();
  }

  onDismiss(): void {
    this.dismissed.emit();
  }

  onSubmit(): void {
    if (!this.reason().trim()) return;
    this.rejected.emit({ reason: this.reason().trim() });
  }

  get isValid(): boolean {
    return this.reason().trim().length >= 5;
  }
}
