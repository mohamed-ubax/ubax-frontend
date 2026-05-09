import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityItem {
  id:          string | number;
  title:       string;
  subtitle?:   string;
  timestamp:   string;
  icon?:       string;
  iconBgClass?: string;
}

/**
 * UbaxActivityFeed — Recent activity list matching Figma "Activités récentes"
 *
 * Usage:
 * ```html
 * <ubax-activity-feed [items]="recentActivities" />
 * ```
 */
@Component({
  selector: 'ubax-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-0">
      @for (item of items(); track item.id) {
        <div class="flex items-start gap-3 py-3 px-6">
          <!-- Icon circle -->
          <div
            class="flex-shrink-0 flex items-center justify-center
                   size-8 rounded-full"
            [ngClass]="item.iconBgClass ?? 'bg-neutral-200'"
          >
            @if (item.icon) {
              <i [class]="item.icon + ' text-base'"></i>
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-base font-regular text-neutral-900 leading-5">
              {{ item.title }}
            </p>
            @if (item.subtitle) {
              <p class="text-sm font-light text-neutral-500 leading-5 truncate">
                {{ item.subtitle }}
              </p>
            }
          </div>

          <!-- Timestamp -->
          <span class="flex-shrink-0 text-sm font-light text-neutral-500 leading-5">
            {{ item.timestamp }}
          </span>
        </div>
      }

      <!-- Footer slot -->
      <ng-content select="[footer]" />
    </div>
  `,
})
export class ActivityFeedComponent {
  readonly items = input<ActivityItem[]>([]);
}
