import { inject, Injectable, NgZone } from '@angular/core';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({ providedIn: 'root' })
export class LenisService {
  private _lenis: Lenis | null = null;
  private readonly _zone = inject(NgZone);
  private readonly _tick = (time: number) => {
    this._lenis?.raf(time * 1000);
  };

  init(): void {
    if (this._lenis) return;
    gsap.registerPlugin(ScrollTrigger);

    // Run Lenis + GSAP ticker entirely outside Angular's change detection
    // to prevent unnecessary CD cycles on every animation frame.
    this._zone.runOutsideAngular(() => {
      this._lenis = new Lenis({
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false,
      });

      gsap.ticker.add(this._tick);
      gsap.ticker.lagSmoothing(0);
      this._lenis.on('scroll', () => ScrollTrigger.update());
    });
  }

  get instance(): Lenis | null {
    return this._lenis;
  }

  destroy(): void {
    gsap.ticker.remove(this._tick);
    this._lenis?.destroy();
    this._lenis = null;
    ScrollTrigger.clearScrollMemory();
  }
}
