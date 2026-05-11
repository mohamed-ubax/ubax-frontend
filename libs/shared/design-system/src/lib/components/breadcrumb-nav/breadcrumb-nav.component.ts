import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  routerLink?: string;
}

@Component({
  selector: 'ubax-breadcrumb-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav
      aria-label="Fil d'Ariane"
      class="flex flex-wrap items-center gap-2 text-md font-regular"
    >
      <ol class="flex flex-wrap items-center gap-2">
        @for (item of items(); track item.label; let last = $last) {
          <li class="flex items-center gap-2">
            @if (item.routerLink && !last) {
              <a
                [routerLink]="item.routerLink"
                class="text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                {{ item.label }}
              </a>
            } @else {
              <span
                [class.text-neutral-500]="!last"
                [class.text-neutral-900]="last"
                [attr.aria-current]="last ? 'page' : null"
              >
                {{ item.label }}
              </span>
            }

            @if (!last) {
              <i class="pi pi-chevron-right text-xs text-neutral-500"></i>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbNavComponent {
  readonly items = input<BreadcrumbItem[]>([]);
}
