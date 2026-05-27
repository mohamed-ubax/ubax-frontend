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
import type { ConfirmVisitRequestDto } from '@ubax-workspace/shared-api-types';
import type { VisitRequest } from '@ubax-workspace/ubax-web-data-access';

const TIME_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
];

@Component({
  selector: 'ubax-visit-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-confirm-dialog.component.html',
  styleUrl: './visit-confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onDismiss()' },
})
export class VisitConfirmDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly visit = input.required<VisitRequest>();
  readonly loading = input<boolean>(false);

  readonly confirmed = output<ConfirmVisitRequestDto>();
  readonly dismissed = output<void>();

  readonly timeSlots = TIME_SLOTS;

  readonly confirmedDate = signal('');
  readonly confirmedTimeSlot = signal('');
  readonly agencyNotes = signal('');

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
    this.confirmedDate.set(this.visit().requestedDate ?? '');
    this.confirmedTimeSlot.set(this.visit().requestedTimeSlot ?? TIME_SLOTS[0]);
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
    if (!this.confirmedDate() || !this.confirmedTimeSlot()) return;
    this.confirmed.emit({
      confirmedDate: this.confirmedDate(),
      confirmedTimeSlot: this.confirmedTimeSlot(),
      agencyNotes: this.agencyNotes() || undefined,
    });
  }

  get isValid(): boolean {
    return !!this.confirmedDate() && !!this.confirmedTimeSlot();
  }
}
