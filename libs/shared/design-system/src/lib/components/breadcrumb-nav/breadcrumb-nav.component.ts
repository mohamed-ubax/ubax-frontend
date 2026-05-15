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
    <nav class="ubax-breadcrumb" aria-label="Fil d'Ariane">
      <ol class="ubax-breadcrumb__list">
        @for (item of items(); track item.label; let last = $last) {
          <li class="ubax-breadcrumb__item">
            @if (item.routerLink && !last) {
              <a [routerLink]="item.routerLink" class="ubax-breadcrumb__link">
                {{ item.label }}
              </a>
            } @else {
              <span
                class="ubax-breadcrumb__current"
                [class.ubax-breadcrumb__current--last]="last"
                [attr.aria-current]="last ? 'page' : null"
              >
                {{ item.label }}
              </span>
            }
            @if (!last) {
              <span class="ubax-breadcrumb__sep" aria-hidden="true">
                <i class="pi pi-chevron-right"></i>
              </span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .ubax-breadcrumb {
      display: inline-flex;
      align-items: center;
    }

    .ubax-breadcrumb__list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
      background: var(--ubax-surface, #fff);
      border: 1px solid var(--ubax-border-card, #e2e8f0);
      border-radius: 999px;
      padding: 6px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .ubax-breadcrumb__item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ubax-breadcrumb__link {
      font-family: 'Lexend', sans-serif;
      font-size: 13px;
      font-weight: 400;
      color: var(--ubax-text-muted, #6b7280);
      text-decoration: none;
      transition: color 0.15s;
      white-space: nowrap;

      &:hover {
        color: var(--ubax-navy, #0f2d5e);
      }
    }

    .ubax-breadcrumb__sep {
      display: flex;
      align-items: center;
      color: var(--ubax-border-card, #e2e8f0);
      margin: 0 2px;

      i {
        font-size: 9px;
        color: var(--ubax-text-muted, #6b7280);
        opacity: 0.5;
      }
    }

    .ubax-breadcrumb__current {
      font-family: 'Lexend', sans-serif;
      font-size: 13px;
      font-weight: 400;
      color: var(--ubax-text-muted, #6b7280);
      white-space: nowrap;

      &--last {
        font-weight: 600;
        color: var(--ubax-navy, #0f2d5e);
      }
    }
  `],
})
export class BreadcrumbNavComponent {
  readonly items = input<BreadcrumbItem[]>([]);
}
