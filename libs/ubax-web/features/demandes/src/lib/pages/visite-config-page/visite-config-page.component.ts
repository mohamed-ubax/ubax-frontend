import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  MesBiensStore,
  VisitesStore,
} from '@ubax-workspace/ubax-web-data-access';
import type { ConfigureVisitAvailabilityDto } from '@ubax-workspace/shared-api-types';
import {
  UiFormSelectComponent,
  UiFormSelectOption,
  UiFormDatePickerComponent,
} from '@ubax-workspace/shared-ui';

const WEEKDAYS: { key: string; label: string; dayNumber: number }[] = [
  { key: 'lundi', label: 'Lundi', dayNumber: 1 },
  { key: 'mardi', label: 'Mardi', dayNumber: 2 },
  { key: 'mercredi', label: 'Mercredi', dayNumber: 3 },
  { key: 'jeudi', label: 'Jeudi', dayNumber: 4 },
  { key: 'vendredi', label: 'Vendredi', dayNumber: 5 },
  { key: 'samedi', label: 'Samedi', dayNumber: 6 },
  { key: 'dimanche', label: 'Dimanche', dayNumber: 0 },
];

const DEFAULT_SLOTS_FOR_DAY = '10:00-14:00';

type DayConfig = {
  enabled: boolean;
  slotsRaw: string;
};

@Component({
  selector: 'ubax-visite-config-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiFormSelectComponent, UiFormDatePickerComponent],
  templateUrl: './visite-config-page.component.html',
  styleUrl: './visite-config-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisiteConfigPageComponent implements OnInit {
  protected readonly visitesStore = inject(VisitesStore);
  protected readonly biensStore = inject(MesBiensStore);

  readonly weekdays = WEEKDAYS;

  // ── Property selection ───────────────────────────────────────────────────
  readonly selectedPropertyId = signal('');

  readonly propertyOptions = computed(() =>
    this.biensStore
      .entities()
      .filter((b) => !!b.id && !!b.title)
      .map((b) => ({ id: b.id as string, label: b.title as string })),
  );

  readonly propertySelectOptions = computed<UiFormSelectOption[]>(() => [
    { label: '— Choisir un bien —', value: '__none__' },
    ...this.propertyOptions().map((o) => ({ label: o.label, value: o.id })),
  ]);

  // ── Slots config ─────────────────────────────────────────────────────────
  readonly dayConfigs = signal<Record<number, DayConfig>>({
    0: { enabled: false, slotsRaw: DEFAULT_SLOTS_FOR_DAY },
    1: { enabled: true,  slotsRaw: DEFAULT_SLOTS_FOR_DAY },
    2: { enabled: true,  slotsRaw: DEFAULT_SLOTS_FOR_DAY },
    3: { enabled: true,  slotsRaw: DEFAULT_SLOTS_FOR_DAY },
    4: { enabled: true,  slotsRaw: DEFAULT_SLOTS_FOR_DAY },
    5: { enabled: true,  slotsRaw: DEFAULT_SLOTS_FOR_DAY },
    6: { enabled: false, slotsRaw: DEFAULT_SLOTS_FOR_DAY },
  });

  readonly maxVisitsPerSlot = signal(3);

  // ── Blackout dates ───────────────────────────────────────────────────────
  readonly blackoutDates = signal<string[]>([]);
  readonly newBlackoutDateObj = signal<Date>(new Date());

  // ── Tabs ─────────────────────────────────────────────────────────────────
  readonly activeTab = signal<'slots' | 'blackout'>('slots');

  ngOnInit(): void {
    this.biensStore.load?.({ pageable: { page: 0, size: 100 } } as never);
  }

  // ── Day config helpers ───────────────────────────────────────────────────
  protected getDayConfig(dayNumber: number): DayConfig {
    return this.dayConfigs()[dayNumber] ?? { enabled: false, slotsRaw: DEFAULT_SLOTS_FOR_DAY };
  }

  protected toggleDay(dayNumber: number): void {
    this.dayConfigs.update((configs) => ({
      ...configs,
      [dayNumber]: {
        ...configs[dayNumber],
        enabled: !configs[dayNumber]?.enabled,
      },
    }));
  }

  protected updateDaySlots(dayNumber: number, value: string): void {
    this.dayConfigs.update((configs) => ({
      ...configs,
      [dayNumber]: {
        ...configs[dayNumber],
        slotsRaw: value,
      },
    }));
  }

  // ── Property selection ───────────────────────────────────────────────────
  protected onPropertySelectChange(value: string): void {
    this.onPropertySelected(value === '__none__' ? '' : value);
  }

  // ── Blackout helpers ─────────────────────────────────────────────────────
  protected addBlackoutDate(): void {
    const date = this.newBlackoutDateObj();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    if (this.blackoutDates().includes(isoDate)) return;
    this.blackoutDates.update((dates) => [...dates, isoDate].sort());
  }

  protected removeBlackoutDate(date: string): void {
    this.blackoutDates.update((dates) => dates.filter((d) => d !== date));
  }

  // ── Validation ───────────────────────────────────────────────────────────
  get isSlotsFormValid(): boolean {
    return !!this.selectedPropertyId();
  }

  get isBlackoutFormValid(): boolean {
    return !!this.selectedPropertyId();
  }

  // ── Submit slots config ──────────────────────────────────────────────────
  protected submitSlotsConfig(): void {
    if (!this.isSlotsFormValid) return;

    const configs = this.dayConfigs();
    const timeSlots: Record<string, string[]> = {};

    for (const [dayNumStr, config] of Object.entries(configs)) {
      if (config.enabled && config.slotsRaw.trim()) {
        const slots = config.slotsRaw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (slots.length > 0) {
          timeSlots[dayNumStr] = slots;
        }
      }
    }

    const dto: ConfigureVisitAvailabilityDto = {
      propertyId: this.selectedPropertyId(),
      timeSlots,
      maxVisitsPerSlot: this.maxVisitsPerSlot(),
      blackoutDates: this.blackoutDates(),
    };

    this.visitesStore.configureAvailability(dto);
  }

  // ── Submit blackout dates ────────────────────────────────────────────────
  protected submitBlackoutDates(): void {
    if (!this.isBlackoutFormValid) return;

    this.visitesStore.updateBlackoutDates({
      propertyId: this.selectedPropertyId(),
      body: { blackoutDates: this.blackoutDates() },
    });
  }

  // ── Load existing config ─────────────────────────────────────────────────
  protected onPropertySelected(id: string): void {
    this.selectedPropertyId.set(id);
    if (id) {
      this.visitesStore.loadPropertyConfig(id);
    }
  }

  // ── Config loading: populate form from store ─────────────────────────────
  protected get loadedConfig() {
    return this.visitesStore.visitConfig();
  }

  protected formatDateDisplay(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }
}
