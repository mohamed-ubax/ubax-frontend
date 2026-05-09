import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

/**
 * UbaxSidebarNavItem — Single navigation item for the sidebar
 *
 * Usage:
 * ```html
 * <ubax-sidebar-nav-item
 *   label="Tableau de bord"
 *   icon="pi pi-home"
 *   routerLink="/dashboard"
 * />
 * ```
 */
@Component({
  selector: 'ubax-sidebar-nav-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a
      [routerLink]="routerLink()"
      routerLinkActive="bg-brand-orange text-white"
      [routerLinkActiveOptions]="{ exact: exact() }"
      class="flex items-center gap-3 px-4 py-3 rounded-xl mx-2
             text-white/75 text-xl font-regular leading-normal
             transition-colors duration-fast ease-ubax
             hover:bg-white/10 hover:text-white
             focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-white/40"
      [attr.aria-label]="label()"
    >
      <!-- Icon -->
      @if (icon()) {
        <i [class]="icon() + ' text-lg w-6 flex-shrink-0'"></i>
      }
      <ng-content select="[icon]" />

      <!-- Label -->
      <span class="flex-1 truncate">{{ label() }}</span>

      <!-- Chevron for expandable items -->
      @if (expandable()) {
        <i class="pi pi-chevron-down text-sm text-white/50 flex-shrink-0"></i>
      }

      <!-- Badge count -->
      @if (badge()) {
        <span
          class="ml-auto bg-white/20 text-white text-sm
                 rounded-full px-2 py-0.5 leading-none"
        >
          {{ badge() }}
        </span>
      }
    </a>
  `,
})
export class SidebarNavItemComponent {
  readonly label      = input.required<string>();
  readonly routerLink = input<string | string[]>('/');
  readonly icon       = input<string>();
  readonly exact      = input<boolean>(false);
  readonly expandable = input<boolean>(false);
  readonly badge      = input<string | number>();
}
