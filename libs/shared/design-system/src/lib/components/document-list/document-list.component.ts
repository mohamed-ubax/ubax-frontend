import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface DocumentItem {
  id: string | number;
  name: string;
  size?: string;
  type?: string;
  url?: string;
}

@Component({
  selector: 'ubax-document-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="overflow-hidden rounded-xl bg-surface-card shadow-card"
      data-ubax-motion="surface"
    >
      <div class="border-b border-neutral-300 px-6 py-4">
        <h3 class="text-2xl font-semibold text-neutral-900">Documents</h3>
      </div>

      <div class="flex flex-col">
        @for (document of documents(); track document.id) {
          <div
            class="flex items-center justify-between gap-4 border-b border-neutral-300 px-6 py-4 last:border-b-0"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              (click)="viewClick.emit(document)"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-info-bg text-info"
              >
                <i [class]="documentIcon(document)"></i>
              </span>
              <div class="min-w-0">
                <p class="truncate text-md font-medium text-neutral-900">
                  {{ document.name }}
                </p>
                <p class="text-sm text-neutral-500">
                  @if (document.type) {
                    {{ document.type }} ·
                  }
                  {{ document.size ?? '—' }}
                </p>
              </div>
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex size-9 items-center justify-center rounded-sm border border-neutral-300 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                [attr.aria-label]="'Voir ' + document.name"
                (click)="viewClick.emit(document)"
              >
                <i class="pi pi-eye"></i>
              </button>

              @if (downloadable()) {
                <button
                  type="button"
                  class="inline-flex size-9 items-center justify-center rounded-sm border border-neutral-300 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  [attr.aria-label]="'Télécharger ' + document.name"
                  (click)="downloadClick.emit(document)"
                >
                  <i class="pi pi-download"></i>
                </button>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class DocumentListComponent {
  readonly documents = input<DocumentItem[]>([]);
  readonly downloadable = input<boolean>(true);

  readonly downloadClick = output<DocumentItem>();
  readonly viewClick = output<DocumentItem>();

  documentIcon(document: DocumentItem): string {
    if (
      document.type?.toLowerCase().includes('pdf') ||
      document.name.toLowerCase().endsWith('.pdf')
    ) {
      return 'pi pi-file-pdf';
    }

    if (
      document.type?.toLowerCase().includes('image') ||
      /\.(png|jpe?g|webp)$/i.test(document.name)
    ) {
      return 'pi pi-image';
    }

    return 'pi pi-file';
  }
}
