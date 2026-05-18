import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ComptableToolbarField } from '../../types/demandes-comptable.types';
import {
  COMPTABLE_CALENDAR_WEEKDAYS,
  COMPTABLE_CALENDAR_WEEKS,
  COMPTABLE_ICONS,
  COMPTABLE_METRICS,
  COMPTABLE_NOTIFICATIONS,
  COMPTABLE_REQUEST_ROWS,
  COMPTABLE_TOOLBAR_FIELDS,
} from '../../constants/demandes-comptable.constants';

@Component({
  selector: 'ubax-demandes-comptable-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demandes-comptable-page.component.html',
  styleUrl: './demandes-comptable-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesComptablePageComponent {
  readonly icons = COMPTABLE_ICONS;
  readonly toolbarFields: readonly ComptableToolbarField[] = COMPTABLE_TOOLBAR_FIELDS;
  readonly metrics = COMPTABLE_METRICS;
  readonly calendarWeekdays = COMPTABLE_CALENDAR_WEEKDAYS;
  readonly calendarWeeks = COMPTABLE_CALENDAR_WEEKS;
  readonly requestRows = COMPTABLE_REQUEST_ROWS;
  readonly notifications = COMPTABLE_NOTIFICATIONS;
}
