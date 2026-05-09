import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

export interface PaymentLine {
  label: string;
  amount: string;
  type?: 'normal' | 'discount' | 'total';
}

@Component({
  selector: 'ubax-payment-breakdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-xl bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="mb-4">
        <h3 class="text-2xl font-semibold text-neutral-900">
          Détail du paiement
        </h3>
        <p class="mt-1 text-md text-neutral-500">{{ currency() }}</p>
      </div>

      <dl class="flex flex-col gap-2">
        @for (line of lines(); track line.label + line.amount) {
          <div
            class="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
            [class.bg-neutral-200]="line.type === 'total'"
            [class.border-t]="line.type === 'total'"
            [class.border-neutral-300]="line.type === 'total'"
          >
            <dt
              class="text-md"
              [class.font-medium]="line.type !== 'total'"
              [class.font-semibold]="line.type === 'total'"
            >
              {{ line.label }}
            </dt>
            <dd
              class="text-md"
              [class.font-medium]="line.type === 'discount'"
              [class.font-semibold]="line.type === 'total'"
              [class.text-danger]="line.type === 'discount'"
              [class.text-neutral-900]="line.type !== 'discount'"
            >
              {{ line.amount }}
            </dd>
          </div>
        }
      </dl>
    </section>
  `,
})
export class PaymentBreakdownComponent {
  readonly lines = input.required<PaymentLine[]>();
  readonly currency = input<string>('FCFA');
}
