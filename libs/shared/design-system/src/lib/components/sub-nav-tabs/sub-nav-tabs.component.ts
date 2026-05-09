import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface SubNavTab {
  label: string;
  value: string;
  count?: number;
  routerLink?: string;
}

@Component({
  selector: 'ubax-sub-nav-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav
      class="flex items-stretch gap-1 border-b border-neutral-300 bg-surface-card"
      aria-label="Sous-navigation"
      data-ubax-motion="surface"
    >
      @for (tab of tabs(); track tab.value) {
        @if (tab.routerLink) {
          <a
            [routerLink]="tab.routerLink"
            class="relative flex min-h-[47px] items-center gap-2 px-4 py-3 text-md font-regular text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            [class.bg-neutral-200]="isActive(tab)"
            [class.text-neutral-900]="isActive(tab)"
            [class.after:content-['']]=true
            [class.after:absolute]=true
            [class.after:left-0]=true
            [class.after:right-0]=true
            [class.after:bottom-0]=true
            [class.after:h-0.5]=true
            [class.after:bg-brand-orange]="isActive(tab)"
            [attr.aria-current]="isActive(tab) ? 'page' : null"
            (click)="tabChange.emit(tab.value)"
          >
            <span>{{ tab.label }}</span>
            @if (tab.count !== undefined) {
              <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-sm text-neutral-500">
                {{ tab.count }}
              </span>
            }
          </a>
        } @else {
          <button
            type="button"
            class="relative flex min-h-[47px] items-center gap-2 px-4 py-3 text-md font-regular text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            [class.bg-neutral-200]="isActive(tab)"
            [class.text-neutral-900]="isActive(tab)"
            [class.after:content-['']]=true
            [class.after:absolute]=true
            [class.after:left-0]=true
            [class.after:right-0]=true
            [class.after:bottom-0]=true
            [class.after:h-0.5]=true
            [class.after:bg-brand-orange]="isActive(tab)"
            [attr.aria-current]="isActive(tab) ? 'page' : null"
            (click)="selectTab(tab.value)"
          >
            <span>{{ tab.label }}</span>
            @if (tab.count !== undefined) {
              <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-sm text-neutral-500">
                {{ tab.count }}
              </span>
            }
          </button>
        }
      }
    </nav>
  `,
})
export class SubNavTabsComponent {
  readonly tabs = input<SubNavTab[]>([]);
  readonly activeValue = input<string>('');

  readonly tabChange = output<string>();

  isActive(tab: SubNavTab): boolean {
    return tab.value === this.activeValue();
  }

  selectTab(value: string): void {
    this.tabChange.emit(value);
  }
}
