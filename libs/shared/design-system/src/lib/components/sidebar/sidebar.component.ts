import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarNavItemComponent } from './sidebar-nav-item.component';

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface NavItem {
  label:      string;
  routerLink: string | string[];
  icon?:      string;
  exact?:     boolean;
  badge?:     string | number;
  expandable?: boolean;
  children?:  NavItem[];
}

/**
 * UbaxSidebar — Main navigation sidebar
 * Matches the Figma sidebar: #1a3047 background, 314px wide,
 * orange active state, Lexend font.
 *
 * Usage:
 * ```html
 * <ubax-sidebar [navGroups]="navGroups" logoSrc="/assets/logo.svg" />
 * ```
 */
@Component({
  selector: 'ubax-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarNavItemComponent],
  template: `
    <aside
      class="bg-surface-sidebar flex flex-col h-full w-sidebar
             flex-shrink-0 overflow-y-auto overflow-x-hidden"
      role="navigation"
      aria-label="Navigation principale"
    >
      <!-- Logo -->
      <div class="flex items-center justify-center px-5 py-6 flex-shrink-0">
        @if (logoSrc()) {
          <img
            [src]="logoSrc()"
            [alt]="logoAlt()"
            class="h-14 w-auto object-contain"
          />
        }
        <ng-content select="[logo]" />
      </div>

      <!-- Navigation groups -->
      <nav class="flex-1 flex flex-col gap-1 py-2">
        @for (group of navGroups(); track group.label) {
          @if (group.label) {
            <p class="px-6 py-2 text-sm font-regular text-white/40 uppercase tracking-wider">
              {{ group.label }}
            </p>
          }
          @for (item of group.items; track item.routerLink) {
            <ubax-sidebar-nav-item
              [label]="item.label"
              [routerLink]="item.routerLink"
              [icon]="item.icon ?? ''"
              [exact]="item.exact ?? false"
              [expandable]="item.expandable ?? false"
              [badge]="item.badge"
            />
          }
        }
      </nav>

      <!-- Footer slot (settings, user) -->
      <div class="flex-shrink-0 border-t border-white/10 py-4">
        <ng-content select="[footer]" />
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly navGroups = input<NavGroup[]>([]);
  readonly logoSrc   = input<string>();
  readonly logoAlt   = input<string>('UBAX');
}
