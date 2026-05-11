import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

export interface MapPin {
  id: string | number;
  lat: number;
  lng: number;
  type: 'hotel' | 'agency';
  name: string;
  city: string;
}

@Component({
  selector: 'ubax-map-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-xl bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-2xl font-semibold text-neutral-900">{{ title() }}</h3>
          <p class="mt-1 text-md text-neutral-500">
            {{ pins().length }} points actifs
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span class="flex items-center gap-2"
            ><span class="size-2.5 rounded-full bg-brand-blue"></span>
            Hôtels</span
          >
          <span class="flex items-center gap-2"
            ><span class="size-2.5 rounded-full bg-brand-orange"></span>
            Agences</span
          >
        </div>
      </div>

      <div
        class="relative overflow-hidden rounded-xl border border-neutral-300 bg-surface-page"
      >
        <div class="absolute inset-0 opacity-70"></div>

        <div class="relative h-[360px] w-full">
          @if (pins().length > 0) {
            @for (pin of pins(); track pin.id) {
              <button
                type="button"
                class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-medium text-white shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                [class.bg-brand-blue]="pin.type === 'hotel'"
                [class.bg-brand-orange]="pin.type === 'agency'"
                [style.left.%]="positionFor(pin).left"
                [style.top.%]="positionFor(pin).top"
                [attr.aria-label]="pin.name + ', ' + pin.city"
                (click)="pinClick.emit(pin)"
              >
                <span class="flex items-center gap-2">
                  <i
                    [class]="
                      pin.type === 'hotel'
                        ? 'pi pi-building'
                        : 'pi pi-briefcase'
                    "
                  ></i>
                  {{ pin.city }}
                </span>
              </button>
            }
          } @else {
            <div
              class="flex h-full items-center justify-center text-md text-neutral-500"
            >
              Aucune localisation disponible.
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class MapViewComponent {
  readonly title = input<string>('Carte interactive');
  readonly pins = input<MapPin[]>([]);
  readonly center = input<[number, number] | null>(null);
  readonly zoom = input<number>(1);

  readonly pinClick = output<MapPin>();

  readonly bounds = computed(() => {
    const pins = this.pins();

    if (pins.length === 0) {
      return {
        minLat: 0,
        maxLat: 1,
        minLng: 0,
        maxLng: 1,
      };
    }

    return pins.reduce(
      (accumulator, pin) => ({
        minLat: Math.min(accumulator.minLat, pin.lat),
        maxLat: Math.max(accumulator.maxLat, pin.lat),
        minLng: Math.min(accumulator.minLng, pin.lng),
        maxLng: Math.max(accumulator.maxLng, pin.lng),
      }),
      {
        minLat: pins[0].lat,
        maxLat: pins[0].lat,
        minLng: pins[0].lng,
        maxLng: pins[0].lng,
      },
    );
  });

  positionFor(pin: MapPin): { left: number; top: number } {
    const bounds = this.bounds();
    const center = this.center();
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.01);
    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.01);
    const zoomFactor = Math.max(this.zoom(), 1);

    const refLat = center ? center[0] : bounds.minLat + latSpan / 2;
    const refLng = center ? center[1] : bounds.minLng + lngSpan / 2;

    const left = 50 + ((pin.lng - refLng) / lngSpan) * 36 * (1 / zoomFactor);
    const top = 50 - ((pin.lat - refLat) / latSpan) * 28 * (1 / zoomFactor);

    return {
      left: Math.max(8, Math.min(92, left)),
      top: Math.max(8, Math.min(92, top)),
    };
  }
}
