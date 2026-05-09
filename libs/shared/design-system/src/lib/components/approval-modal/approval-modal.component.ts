import { CommonModule } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface ApprovalSummary {
  partnerType: string;
  companyName: string;
  representative: string;
  approvalDate: string;
}

@Component({
  selector: 'ubax-approval-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [style]="{ width: '930px', maxWidth: 'calc(100vw - 2rem)' }"
      styleClass="ubax-dialog"
      data-ubax-motion="surface"
    >
      <ng-template pTemplate="header">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h3 class="text-3xl font-semibold text-brand-navy">
              Félicitations ! {{ entityLabel() }} est maintenant
              {{ entityState() }}
            </h3>
            <p class="mt-2 text-md text-neutral-500">{{ subtitle() }}</p>
          </div>

          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="Fermer"
            (click)="close()"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </ng-template>

      <div class="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-xl bg-neutral-50 p-6">
          <dl class="grid gap-4 md:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-neutral-500">
                Type partenaire
              </dt>
              <dd class="mt-1 text-md font-medium text-neutral-900">
                {{ summary().partnerType }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-neutral-500">
                Raison sociale
              </dt>
              <dd class="mt-1 text-md font-medium text-neutral-900">
                {{ summary().companyName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-neutral-500">
                Représentant légal
              </dt>
              <dd class="mt-1 text-md font-medium text-neutral-900">
                {{ summary().representative }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-neutral-500">
                Date d'approbation
              </dt>
              <dd class="mt-1 text-md font-medium text-neutral-900">
                {{ summary().approvalDate }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="rounded-xl border border-neutral-300 p-6">
          <p class="text-md text-neutral-500">{{ supportText() }}</p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex flex-wrap justify-end gap-3">
          <p-button
            [label]="profileButtonLabel()"
            severity="secondary"
            (onClick)="viewProfile.emit()"
          />
          <p-button label="Fermer" (onClick)="close()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class ApprovalModalComponent {
  readonly visible = model<boolean>(false);
  readonly summary = input.required<ApprovalSummary>();
  readonly entityType = input<'hotel' | 'agency'>('agency');

  readonly viewProfile = output<void>();

  readonly entityLabel = computed(() =>
    this.entityType() === 'agency' ? "L'agence" : "L'hôtel",
  );
  readonly entityState = computed(() =>
    this.entityType() === 'agency' ? 'active' : 'actif',
  );
  readonly profileButtonLabel = computed(() =>
    this.entityType() === 'agency'
      ? "Voir le profil de l'agence"
      : "Voir le profil de l'hôtel",
  );
  readonly subtitle = computed(() =>
    this.entityType() === 'agency'
      ? 'L’agence a été validée avec succès et peut maintenant apparaître dans le back-office.'
      : 'L’hôtel a été validé avec succès et peut maintenant apparaître dans le back-office.',
  );
  readonly supportText = computed(() =>
    this.entityType() === 'agency'
      ? 'Vous pouvez partager immédiatement le profil et poursuivre la gestion des documents.'
      : 'Vous pouvez consulter le profil et poursuivre la configuration des chambres.',
  );

  close(): void {
    this.visible.set(false);
  }
}
